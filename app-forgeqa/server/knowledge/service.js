import { chunkText } from "./chunker.js";
import {
  extractTextFromBuffer,
  extractTextFromFile,
  getFileType,
} from "./parsers.js";

export function createKnowledgeService(store, env = {}) {
  function withoutExtractedText(file) {
    const publicFile = { ...file };
    delete publicFile.extracted_text;
    return publicFile;
  }

  async function saveExtractedKnowledge({
    fileName,
    fileType,
    sourceType,
    text,
    pageCount,
  }, userId) {
    if (!text.trim()) {
      throw new Error(`No readable text found in ${fileName}`);
    }

    const file = await store.createFile({
      user_id: userId || env.DEFAULT_USER_ID || "local-user",
      file_name: fileName,
      file_type: fileType,
      source_type: sourceType,
      status: "needs_chunking",
      extracted_text: text,
      page_count: pageCount,
    });

    return withoutExtractedText({
      ...file,
      status: "needs_chunking",
      chunk_count: 0,
    });
  }

  return {
    async processUpload(file, userId) {
      const parsed = await extractTextFromFile(file);

      return saveExtractedKnowledge({
        fileName: file.originalname,
        fileType: parsed.fileType,
        sourceType: "upload",
        text: parsed.text,
        pageCount: parsed.pageCount,
      }, userId);
    },

    async processSharePointUrl(url, userId) {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:") throw new Error("Only HTTPS URLs are allowed.");
      if (!parsed.hostname.endsWith(".sharepoint.com") && !parsed.hostname.endsWith(".sharepoint.cn")) {
        throw new Error("Only SharePoint domains are allowed.");
      }

      const headers = {};
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      try {
        const response = await fetch(url, { headers, signal: controller.signal });
        clearTimeout(timeout);

        if (!response.ok) {
          throw new Error(
            `Unable to fetch SharePoint document (${response.status}). Please check the URL and file permissions.`,
          );
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileName = decodeURIComponent(url.split("/").pop()?.split("?")[0] || "sharepoint-document");
        const fileType = getFileType(fileName, response.headers.get("content-type") ?? "");
        const parsed = await extractTextFromBuffer(buffer, {
          fileName,
          fileType,
          mimeType: response.headers.get("content-type") ?? "",
        });

        return saveExtractedKnowledge({
          fileName,
          fileType,
          sourceType: "sharepoint",
          text: parsed.text,
          pageCount: parsed.pageCount,
        }, userId);
      } catch (fetchErr) {
        clearTimeout(timeout);
        if (fetchErr.name === "AbortError") throw new Error("SharePoint request timed out.");
        throw fetchErr;
      }
    },

    listFiles(search, userId) {
      return store.listFiles(search, userId);
    },

    async deleteFile(id, userId) {
      return store.deleteFile(id, userId);
    },

    async refreshChunks(userId) {
      const files = await store.listChunkableFiles(userId);
      let chunkCount = 0;

      for (const file of files) {
        const chunks = chunkText(file.extracted_text, {
          pageNumber: file.page_count ? 1 : null,
        });

        if (!chunks.length) {
          await store.updateFile(file.id, {
            status: "failed",
            chunk_count: 0,
          }, userId);
          continue;
        }

        await store.replaceChunks(file.id, chunks, userId);
        chunkCount += chunks.length;
      }

      return {
        fileCount: files.length,
        chunkCount,
      };
    },

    searchChunks(query, limit, userId) {
      return store.searchChunks(query, limit, userId);
    },
  };
}
