import { getDb } from '../db.js';
import { ObjectId } from 'mongodb';
import { rankChunks } from '../knowledge/search.js';

export function createMongoKnowledgeStore() {
  return {
    mode: 'mongo',

    async createFile(file) {
      const db = getDb();
      const now = new Date().toISOString();
      const doc = {
        userId: file.user_id ?? null,
        fileName: file.file_name,
        fileType: file.file_type,
        sourceType: file.source_type,
        status: file.status ?? 'needs_chunking',
        extractedText: file.extracted_text ?? '',
        entities: file.entities ?? [],
        externalId: file.external_id ?? null,
        externalUrl: file.external_url ?? null,
        modifiedAt: file.modified_at ?? null,
        lastSyncedAt: file.last_synced_at ?? null,
        contentHash: file.content_hash ?? null,
        pageCount: file.page_count ?? null,
        chunkCount: 0,
        uploadDate: now,
        createdAt: now,
      };
      const result = await db.collection('knowledge_files').insertOne(doc);
      return {
        id: result.insertedId.toString(),
        user_id: file.user_id,
        file_name: file.file_name,
        file_type: file.file_type,
        upload_date: now,
        source_type: file.source_type,
        status: doc.status,
        chunk_count: 0,
        extracted_text: file.extracted_text ?? '',
        entities: file.entities ?? [],
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
      const result = await db.collection('knowledge_files').updateOne(query, { $set: mongoPatch });
      if (!result.matchedCount) throw new Error('File not found or access denied.');
      return this.listFiles('', null).then((files) => files.find((f) => f.id === id));
    },

    async findFileByExternalId(sourceType, externalId, userId) {
      const db = getDb();
      const query = { sourceType, externalId };
      if (userId) query.userId = userId;
      const file = await db.collection('knowledge_files').findOne(query, {
        projection: { _id: 1, modifiedAt: 1, contentHash: 1 },
      });
      return file
        ? {
            id: file._id.toString(),
            modified_at: file.modifiedAt,
            content_hash: file.contentHash,
          }
        : null;
    },

    async clearFileChunks(fileId, userId) {
      const db = getDb();
      const fileQuery = { _id: new ObjectId(fileId) };
      if (userId) fileQuery.userId = userId;
      const file = await db.collection('knowledge_files').findOne(fileQuery, {
        projection: { _id: 1 },
      });
      if (!file) throw new Error('File not found or access denied.');
      await db.collection('knowledge_chunks').deleteMany({ fileId });
      await db
        .collection('knowledge_files')
        .updateOne(fileQuery, { $set: { status: 'needs_chunking', chunkCount: 0 } });
    },

    async replaceChunks(fileId, chunks, userId) {
      const db = getDb();
      const fileQuery = { _id: new ObjectId(fileId) };
      if (userId) fileQuery.userId = userId;
      const file = await db
        .collection('knowledge_files')
        .findOne(fileQuery, { projection: { _id: 1 } });
      if (!file) throw new Error('File not found or access denied.');
      await db.collection('knowledge_chunks').deleteMany({ fileId });

      const now = new Date().toISOString();
      const rows = chunks.map((chunk) => ({
        fileId,
        chunkText: chunk.chunk_text,
        embedding: chunk.embedding ?? null,
        pageNumber: chunk.page_number ?? null,
        section: chunk.section ?? null,
        entity: chunk.entity ?? null,
        createdAt: now,
      }));
      await db.collection('knowledge_chunks').insertMany(rows);

      await db
        .collection('knowledge_files')
        .updateOne(fileQuery, { $set: { status: 'ready', chunkCount: rows.length } });

      return rows.map((r) => ({
        file_id: r.fileId,
        chunk_text: r.chunkText,
        embedding: r.embedding,
        page_number: r.pageNumber,
        section: r.section,
        entity: r.entity,
        created_at: r.createdAt,
      }));
    },

    async insertChunks(fileId, chunks) {
      return this.replaceChunks(fileId, chunks);
    },

    async listChunkableFiles(userId) {
      const db = getDb();
      const query = { status: { $ne: 'failed' }, extractedText: { $exists: true, $ne: '' } };
      if (userId) query.userId = userId;
      const docs = await db
        .collection('knowledge_files')
        .find(query)
        .project({ id: 1, extractedText: 1, pageCount: 1, status: 1, entities: 1 })
        .toArray();
      return docs.map((d) => ({
        id: d._id.toString(),
        extracted_text: d.extractedText,
        page_count: d.pageCount,
        entities: d.entities ?? [],
        status: d.status,
      }));
    },

    async listFiles(search = '', userId) {
      const db = getDb();
      const query = {};
      if (userId) query.userId = userId;
      const docs = await db
        .collection('knowledge_files')
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
          external_url: d.externalUrl ?? null,
          last_synced_at: d.lastSyncedAt ?? null,
          status: d.status,
          chunk_count: d.chunkCount,
          created_at: d.createdAt,
        }));
    },

    async deleteFile(id, userId) {
      const db = getDb();
      const query = { _id: new ObjectId(id) };
      if (userId) query.userId = userId;
      await db.collection('knowledge_chunks').deleteMany({ fileId: id });
      const result = await db.collection('knowledge_files').deleteOne(query);
      if (!result.deletedCount) throw new Error('File not found or access denied.');
    },

    async searchChunks(query = '', limit = 50, userId, fileId = null, queryEmbedding = null) {
      const db = getDb();

      const userFileIds = await db
        .collection('knowledge_files')
        .find(userId ? { userId } : {}, { projection: { _id: 1 } })
        .toArray()
        .then((docs) => docs.map((d) => d._id.toString()));

      const fileQuery = {};
      if (fileId) {
        fileQuery.fileId = fileId;
      } else if (userId) {
        fileQuery.fileId = { $in: userFileIds };
      }

      const allChunks = await db.collection('knowledge_chunks').find(fileQuery).toArray();

      const filesMap = {};
      const files = await db
        .collection('knowledge_files')
        .find(userId ? { userId } : {})
        .toArray();
      for (const f of files) filesMap[f._id.toString()] = f;

      const normalized = allChunks.map((chunk) => {
        const file = filesMap[chunk.fileId] || {};
        return {
          id: chunk._id.toString(),
          file_id: chunk.fileId,
          chunk_text: chunk.chunkText,
          embedding: chunk.embedding ?? null,
          page_number: chunk.pageNumber,
          section: chunk.section ?? null,
          entity: chunk.entity ?? null,
          user_id: file.userId,
          file_name: file.fileName ?? 'Unknown file',
          created_at: chunk.createdAt,
        };
      });
      return rankChunks(
        normalized.filter((chunk) => !userId || chunk.user_id === userId),
        query,
        limit,
        queryEmbedding
      );
    },
  };
}
