import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { rankChunks } from '../knowledge/search.js';

const DATA_DIR = path.resolve('.data');
const DB_PATH = path.join(DATA_DIR, 'knowledge-store.json');

const emptyState = {
  user_projects: [],
  knowledge_files: [],
  knowledge_chunks: [],
};

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.writeFile(DB_PATH, JSON.stringify(emptyState, null, 2));
  }
}

async function readStore() {
  await ensureStore();
  const raw = await fs.readFile(DB_PATH, 'utf8');
  return JSON.parse(raw);
}

async function writeStore(state) {
  await ensureStore();
  await fs.writeFile(DB_PATH, JSON.stringify(state, null, 2));
}

function createId() {
  return crypto.randomUUID();
}

export function createLocalKnowledgeStore() {
  return {
    mode: 'local',

    async createFile(file) {
      const state = await readStore();
      const now = new Date().toISOString();
      const record = {
        id: createId(),
        user_id: file.user_id ?? 'local-user',
        file_name: file.file_name,
        file_type: file.file_type,
        upload_date: now,
        source_type: file.source_type,
        status: file.status ?? 'needs_chunking',
        chunk_count: 0,
        extracted_text: file.extracted_text ?? '',
        entities: file.entities ?? [],
        external_id: file.external_id ?? null,
        external_url: file.external_url ?? null,
        modified_at: file.modified_at ?? null,
        last_synced_at: file.last_synced_at ?? null,
        content_hash: file.content_hash ?? null,
        page_count: file.page_count ?? null,
        created_at: now,
      };

      state.knowledge_files.unshift(record);
      await writeStore(state);
      return record;
    },

    async updateFile(id, patch, _userId) {
      const state = await readStore();
      state.knowledge_files = state.knowledge_files.map((file) =>
        file.id === id ? { ...file, ...patch } : file
      );
      await writeStore(state);
      return state.knowledge_files.find((file) => file.id === id);
    },

    async findFileByExternalId(sourceType, externalId, userId) {
      const state = await readStore();
      const file = state.knowledge_files.find(
        (item) =>
          item.source_type === sourceType &&
          item.external_id === externalId &&
          (!userId || item.user_id === userId)
      );
      return file
        ? {
            id: file.id,
            modified_at: file.modified_at,
            content_hash: file.content_hash,
          }
        : null;
    },

    async clearFileChunks(fileId, userId) {
      const state = await readStore();
      const file = state.knowledge_files.find(
        (item) => item.id === fileId && (!userId || item.user_id === userId)
      );
      if (!file) throw new Error('File not found or access denied.');
      state.knowledge_chunks = state.knowledge_chunks.filter((chunk) => chunk.file_id !== fileId);
      Object.assign(file, { status: 'needs_chunking', chunk_count: 0 });
      await writeStore(state);
    },

    async replaceChunks(fileId, chunks, _userId) {
      const state = await readStore();
      const records = chunks.map((chunk) => ({
        id: createId(),
        file_id: fileId,
        chunk_text: chunk.chunk_text,
        embedding: chunk.embedding ?? null,
        page_number: chunk.page_number ?? null,
        section: chunk.section ?? null,
        entity: chunk.entity ?? null,
        created_at: new Date().toISOString(),
      }));

      state.knowledge_chunks = state.knowledge_chunks.filter((chunk) => chunk.file_id !== fileId);
      state.knowledge_chunks.push(...records);
      state.knowledge_files = state.knowledge_files.map((file) =>
        file.id === fileId ? { ...file, chunk_count: records.length, status: 'ready' } : file
      );
      await writeStore(state);
      return records;
    },

    async insertChunks(fileId, chunks, userId) {
      return this.replaceChunks(fileId, chunks, userId);
    },

    async listChunkableFiles(userId) {
      const state = await readStore();

      return state.knowledge_files.filter((file) => {
        if (userId && file.user_id !== userId) return false;
        return file.extracted_text && file.status !== 'failed';
      });
    },

    async listFiles(search = '', userId) {
      const state = await readStore();
      const query = search.trim().toLowerCase();

      return state.knowledge_files
        .filter((file) => {
          if (userId && file.user_id !== userId) return false;
          if (!query) return true;

          return [file.file_name, file.file_type, file.source_type, file.status]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query));
        })
        .map((file) => {
          const publicFile = { ...file };
          delete publicFile.extracted_text;
          return publicFile;
        });
    },

    async deleteFile(id, _userId) {
      const state = await readStore();
      state.knowledge_files = state.knowledge_files.filter((file) => file.id !== id);
      state.knowledge_chunks = state.knowledge_chunks.filter((chunk) => chunk.file_id !== id);
      await writeStore(state);
    },

    async searchChunks(query = '', limit = 50, userId, fileId = null, queryEmbedding = null) {
      const state = await readStore();
      const candidates = state.knowledge_chunks
        .filter((chunk) => {
          if (fileId && chunk.file_id !== fileId) return false;
          return true;
        })
        .map((chunk) => {
          const file = state.knowledge_files.find((item) => item.id === chunk.file_id);

          return {
            ...chunk,
            user_id: file?.user_id,
            file_name: file?.file_name ?? 'Unknown file',
          };
        })
        .filter((chunk) => !userId || chunk.user_id === userId);
      return rankChunks(candidates, query, limit, queryEmbedding);
    },
  };
}
