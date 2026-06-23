import { getDb } from "../db.js";
import { ObjectId } from "mongodb";

export function createMongoKnowledgeStore() {
  return {
    mode: "mongo",

    async createFile(file) {
      const db = getDb();
      const now = new Date().toISOString();
      const doc = {
        userId: file.user_id ?? null,
        fileName: file.file_name,
        fileType: file.file_type,
        sourceType: file.source_type,
        status: file.status ?? "needs_chunking",
        extractedText: file.extracted_text ?? "",
        pageCount: file.page_count ?? null,
        chunkCount: 0,
        uploadDate: now,
        createdAt: now,
      };
      const result = await db.collection("knowledge_files").insertOne(doc);
      return {
        id: result.insertedId.toString(),
        user_id: file.user_id,
        file_name: file.file_name,
        file_type: file.file_type,
        upload_date: now,
        source_type: file.source_type,
        status: doc.status,
        chunk_count: 0,
        extracted_text: file.extracted_text ?? "",
        page_count: file.page_count ?? null,
        created_at: now,
      };
    },

    async updateFile(id, patch, userId) {
      const db = getDb();
      const query = { _id: new ObjectId(id) };
      if (userId) query.userId = userId;
      const mongoPatch = {};
      for (const [k, v] of Object.entries(patch)) {
        const key = k.replace(/_(.)/g, (_, c) => c.toUpperCase());
        mongoPatch[key] = v;
      }
      const result = await db.collection("knowledge_files").updateOne(query, { $set: mongoPatch });
      if (!result.matchedCount) throw new Error("File not found or access denied.");
      return this.listFiles("", null).then((files) => files.find((f) => f.id === id));
    },

    async replaceChunks(fileId, chunks, userId) {
      const db = getDb();
      const fileQuery = { _id: new ObjectId(fileId) };
      if (userId) fileQuery.userId = userId;
      const file = await db.collection("knowledge_files").findOne(fileQuery, { projection: { _id: 1 } });
      if (!file) throw new Error("File not found or access denied.");
      await db.collection("knowledge_chunks").deleteMany({ fileId });

      const now = new Date().toISOString();
      const rows = chunks.map((chunk) => ({
        fileId,
        chunkText: chunk.chunk_text,
        pageNumber: chunk.page_number ?? null,
        createdAt: now,
      }));
      await db.collection("knowledge_chunks").insertMany(rows);

      await db.collection("knowledge_files").updateOne(
        fileQuery,
        { $set: { status: "ready", chunkCount: rows.length } }
      );

      return rows.map((r) => ({
        file_id: r.fileId,
        chunk_text: r.chunkText,
        page_number: r.pageNumber,
        created_at: r.createdAt,
      }));
    },

    async insertChunks(fileId, chunks) {
      return this.replaceChunks(fileId, chunks);
    },

    async listChunkableFiles(userId) {
      const db = getDb();
      const query = { status: { $ne: "failed" }, extractedText: { $exists: true, $ne: "" } };
      if (userId) query.userId = userId;
      const docs = await db.collection("knowledge_files")
        .find(query)
        .project({ id: 1, extractedText: 1, pageCount: 1, status: 1 })
        .toArray();
      return docs.map((d) => ({ id: d._id.toString(), extracted_text: d.extractedText, page_count: d.pageCount, status: d.status }));
    },

    async listFiles(search = "", userId) {
      const db = getDb();
      const query = {};
      if (userId) query.userId = userId;
      const docs = await db.collection("knowledge_files")
        .find(query)
        .sort({ uploadDate: -1 })
        .toArray();

      return docs
        .filter((d) => {
          if (!search.trim()) return true;
          const q = search.trim().toLowerCase();
          return [d.fileName, d.fileType, d.sourceType, d.status]
            .filter(Boolean)
            .some((v) => v.toLowerCase().includes(q));
        })
        .map((d) => ({
          id: d._id.toString(),
          user_id: d.userId,
          file_name: d.fileName,
          file_type: d.fileType,
          upload_date: d.uploadDate,
          source_type: d.sourceType,
          status: d.status,
          chunk_count: d.chunkCount,
          created_at: d.createdAt,
        }));
    },

    async deleteFile(id, userId) {
      const db = getDb();
      const query = { _id: new ObjectId(id) };
      if (userId) query.userId = userId;
      await db.collection("knowledge_chunks").deleteMany({ fileId: id });
      const result = await db.collection("knowledge_files").deleteOne(query);
      if (!result.deletedCount) throw new Error("File not found or access denied.");
    },

    async searchChunks(query, limit = 8, userId) {
      const db = getDb();
      const terms = query.toLowerCase().split(/\W+/).filter((t) => t.length > 2);

      const userFileIds = await db.collection("knowledge_files")
        .find(userId ? { userId } : {}, { projection: { _id: 1 } })
        .toArray()
        .then((docs) => docs.map((d) => d._id.toString()));

      const fileQuery = userId ? { fileId: { $in: userFileIds } } : {};
      const allChunks = await db.collection("knowledge_chunks").find(fileQuery).toArray();

      const filesMap = {};
      const files = await db.collection("knowledge_files")
        .find(userId ? { userId } : {})
        .toArray();
      for (const f of files) filesMap[f._id.toString()] = f;

      const results = allChunks
        .map((chunk) => {
          const text = chunk.chunkText.toLowerCase();
          const score = terms.reduce((total, term) => total + (text.includes(term) ? 1 : 0), 0);
          const file = filesMap[chunk.fileId] || {};
          return {
            id: chunk._id.toString(),
            file_id: chunk.fileId,
            chunk_text: chunk.chunkText,
            page_number: chunk.pageNumber,
            score,
            user_id: file.userId,
            file_name: file.fileName ?? "Unknown file",
            created_at: chunk.createdAt,
          };
        })
        .filter((chunk) => chunk.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return results;
    },
  };
}
