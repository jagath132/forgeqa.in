export interface KnowledgeFile {
  id: string;
  file_name: string;
  file_type: string;
  upload_date: string;
  source_type: 'upload' | 'sharepoint';
  status: 'processing' | 'needs_chunking' | 'ready' | 'failed';
  chunk_count?: number;
}

export interface KnowledgeChunk {
  fileName: string;
  chunkText: string;
  score: number;
}

export interface PrdFromTextRequest {
  productName?: string;
  moduleName?: string;
  details: string;
  provider?: string;
  model?: string;
  apiKey?: string;
}

export interface PrdFromUrlRequest {
  url: string;
  email?: string;
  password?: string;
  focus?: string;
  provider?: string;
  model?: string;
  apiKey?: string;
}

export interface PrdSaveToKbResponse {
  ok: boolean;
  file: KnowledgeFile;
  chunkCount: number;
}
