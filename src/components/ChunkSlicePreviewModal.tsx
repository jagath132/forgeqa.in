import React, { useState, useEffect } from 'react';
import { Layers, X, Search, Copy, Check, Sparkles } from 'lucide-react';
import { api, type KnowledgeFile } from '../lib/api';

interface ChunkRecord {
  id: string;
  file_id: string;
  chunk_text: string;
  page_number?: number | null;
  created_at?: string;
  score?: number;
}

interface ChunkSlicePreviewModalProps {
  file: KnowledgeFile | null;
  onClose: () => void;
}

export function ChunkSlicePreviewModal({ file, onClose }: ChunkSlicePreviewModalProps) {
  const [chunks, setChunks] = useState<ChunkRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const targetFileId = file?.id;
    if (!targetFileId) return;
    let active = true;

    async function loadChunks() {
      setLoading(true);
      try {
        const res = await api.get('/api/knowledge/search', {
          params: { fileId: targetFileId, limit: 100 },
        });
        if (active) {
          setChunks(res.data.chunks || []);
        }
      } catch (err) {
        console.error('Failed to load chunks for preview:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadChunks();
    return () => {
      active = false;
    };
  }, [file]);

  if (!file) return null;

  const filteredChunks = chunks.filter((c) =>
    searchQuery.trim()
      ? c.chunk_text.toLowerCase().includes(searchQuery.trim().toLowerCase())
      : true
  );

  const totalWords = chunks.reduce(
    (acc, c) => acc + (c.chunk_text.trim().split(/\s+/).filter(Boolean).length || 0),
    0
  );
  const estimatedTokens = Math.round(totalWords * 1.33);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-4xl w-full max-h-[88vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                  {file.file_name}
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-indigo-100/70 text-indigo-700">
                  {file.file_type}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Vector Slices & Embedding Token Previews for AI Prompt Injection
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Telemetry Strip & Search */}
        <div className="px-6 py-3.5 border-b border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>{chunks.length} Vector Chunks</span>
            </div>
            <div>•</div>
            <div>~{estimatedTokens.toLocaleString()} Estimated Tokens</div>
            <div>•</div>
            <div>
              Status: <strong className="text-slate-800 uppercase">{file.status}</strong>
            </div>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search in slices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Chunks List */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-slate-50/40">
          {loading ? (
            <div className="space-y-3 py-8 text-center">
              <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">
                Retrieving vector slices from knowledge index...
              </p>
            </div>
          ) : filteredChunks.length === 0 ? (
            <div className="text-center py-12 px-4 bg-white rounded-xl border border-dashed border-slate-200">
              <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">No slices found</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {chunks.length === 0
                  ? 'This file has not generated any text chunks yet. Uploaded files auto-chunk on ingest.'
                  : 'No chunks matched your search query.'}
              </p>
            </div>
          ) : (
            filteredChunks.map((chunk, idx) => {
              const words = chunk.chunk_text.trim().split(/\s+/).filter(Boolean).length;
              const tokens = Math.round(words * 1.33);

              return (
                <div
                  key={chunk.id || idx}
                  className="p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all group"
                >
                  <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                        Slice #{idx + 1}
                      </span>
                      {chunk.page_number && (
                        <span className="text-[11px] font-medium text-slate-500">
                          Page {chunk.page_number}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400">
                        {words} words • ~{tokens} tokens
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopy(chunk.id || String(idx), chunk.chunk_text)}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-indigo-600 transition-colors p-1"
                      title="Copy slice text"
                    >
                      {copiedId === (chunk.id || String(idx)) ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600 font-semibold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-xs sm:text-[13px] text-slate-700 font-mono leading-relaxed whitespace-pre-wrap break-words bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                    {chunk.chunk_text}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-800">{filteredChunks.length}</strong> of{' '}
            <strong className="text-slate-800">{chunks.length}</strong> chunks
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
