import { useCallback, useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { api, type KnowledgeFile } from "../lib/api";
import { useAppStore } from "../store/useAppStore";
import { Card } from "../components/ui/Card";

const fileIcons: Record<string, { label: string; color: string }> = {
  pdf: { label: "PDF", color: "badge-danger" },
  docx: { label: "DOC", color: "badge-primary" },
  excel: { label: "XLS", color: "badge-success" },
  csv: { label: "CSV", color: "badge-success" },
  text: { label: "TXT", color: "badge" },
  image: { label: "IMG", color: "badge-warning" },
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "2-digit", year: "numeric" }).format(new Date(value));
}

export function KnowledgeBase() {
  const setQaResult = useAppStore((s) => s.setQaResult);
  const clearHistory = useAppStore((s) => s.clearHistory);
  const [files, setFiles] = useState<KnowledgeFile[]>([]);
  const [search, setSearch] = useState("");
  const [sharePointUrl, setSharePointUrl] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isChunking, setIsChunking] = useState(false);
  const [chunkRefreshNeeded, setChunkRefreshNeeded] = useState(false);
  const [showReadyBanner, setShowReadyBanner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [filePendingDelete, setFilePendingDelete] = useState<KnowledgeFile | null>(null);

  const readyCount = files.filter((file) => file.status === "ready").length;
  const needsChunkingCount = files.filter((file) => file.status === "needs_chunking").length;
  const chunkCount = files.reduce((total, file) => total + (file.chunk_count ?? 0), 0);
  const canRefreshChunks = files.length > 0;

  const loadFiles = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/api/knowledge/files", { params: { search } });
      const loadedFiles: KnowledgeFile[] = response.data.files;
      setFiles(loadedFiles);
      if (loadedFiles.length === 0) {
        setQaResult(null);
        clearHistory();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load files.");
    } finally {
      setIsLoading(false);
    }
  }, [search, setQaResult, clearHistory]);

  useEffect(() => {
    const timeout = window.setTimeout(() => { void loadFiles(); }, 200);
    return () => window.clearTimeout(timeout);
  }, [loadFiles]);

  useEffect(() => {
    if (!showReadyBanner) return;
    const id = window.setTimeout(() => setShowReadyBanner(false), 4000);
    return () => window.clearTimeout(id);
  }, [showReadyBanner]);

  const uploadFiles = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;
    const formData = new FormData();
    acceptedFiles.forEach((file) => formData.append("files", file));
    setIsUploading(true);
    setUploadProgress(4);
    setMessage("");
    try {
      await api.post("/api/knowledge/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (event) => {
          if (!event.total) return;
          setUploadProgress(Math.round((event.loaded / event.total) * 100));
        },
      });
      setChunkRefreshNeeded(true);
      setMessage("Knowledge files parsed and saved. Click Create / Refresh chunks to rebuild embeddings.");
      await loadFiles();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to upload knowledge files.");
    } finally {
      setIsUploading(false);
      window.setTimeout(() => setUploadProgress(0), 800);
    }
  }, [loadFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: uploadFiles,
    multiple: true,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt", ".md"],
      "text/csv": [".csv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "image/*": [".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff"],
    },
  });

  async function addSharePointDocument() {
    if (!sharePointUrl.trim()) { setMessage("Paste a SharePoint document URL first."); return; }
    setIsUploading(true);
    setUploadProgress(25);
    setMessage("");
    try {
      await api.post("/api/knowledge/sharepoint", { url: sharePointUrl.trim() });
      setSharePointUrl("");
      setChunkRefreshNeeded(true);
      setMessage("SharePoint document parsed. Click Create / Refresh chunks to rebuild embeddings.");
      await loadFiles();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to fetch SharePoint document.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }

  async function deleteFile(id: string) {
    try {
      await api.delete(`/api/knowledge/files/${id}`);
      setChunkRefreshNeeded(true);
      await loadFiles();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to delete file.");
    }
  }

  async function refreshChunks() {
    setIsChunking(true);
    setMessage("");
    try {
      const response = await api.post("/api/knowledge/chunks/refresh");
      setChunkRefreshNeeded(false);
      setMessage(`Chunks refreshed for ${response.data.fileCount} file(s). Stored ${response.data.chunkCount} reusable chunk(s).`);
      await loadFiles();
      setShowReadyBanner(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to create chunks.");
    } finally {
      setIsChunking(false);
    }
  }

  const fileTypeBreakdown = useMemo(() => {
    return files.reduce<Record<string, number>>((counts, file) => {
      counts[file.file_type] = (counts[file.file_type] ?? 0) + 1;
      return counts;
    }, {});
  }, [files]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Metrics */}
      <div className="grid gap-5 sm:grid-cols-3">
        <MetricCard label="Knowledge Source Files" value={files.length} />
        <MetricCard label="Ready For Prompt Context" value={readyCount} />
        <MetricCard label="Vector Database Chunks" value={chunkCount} />
      </div>

      {/* Chunk builder */}
      <Card>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Knowledge Vectorization</h2>
            <p className="text-xs mt-0.5 max-w-xl" style={{ color: "var(--text-muted)" }}>
              File uploads save text fields locally. Regenerate embeddings to update prompt-matching vector chunks.
            </p>
          </div>
          <button
            className={`px-5 py-2.5 text-sm font-semibold rounded-lg transition-all ${
              canRefreshChunks ? "btn-primary" : "opacity-40 cursor-not-allowed px-5 py-2.5 text-sm font-semibold rounded-lg"
            }`}
            disabled={!canRefreshChunks || isChunking}
            onClick={refreshChunks}
            type="button"
            style={!canRefreshChunks ? { background: "var(--bg-tertiary)", color: "var(--text-muted)" } : undefined}
          >
            {isChunking ? "Regenerating..." : "Create / Refresh Chunks"}
          </button>
        </div>
        {needsChunkingCount > 0 ? (
          <div className="mt-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium" style={{ background: "var(--warning-soft)", color: "var(--warning)", border: "1px solid color-mix(in srgb, var(--warning) 25%, transparent)" }}>
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{needsChunkingCount} file(s) need chunking. Click refresh to generate embeddings.</span>
          </div>
        ) : chunkRefreshNeeded ? (
          <div className="mt-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium" style={{ background: "var(--warning-soft)", color: "var(--warning)", border: "1px solid color-mix(in srgb, var(--warning) 25%, transparent)" }}>
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>Files changed since last vectorization. Regenerate chunks to refresh embeddings.</span>
          </div>
        ) : showReadyBanner ? (
          <div className="mt-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium" style={{ background: "var(--success-soft)", color: "var(--success)", border: "1px solid color-mix(in srgb, var(--success) 25%, transparent)" }}>
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>All files vectorized and ready.</span>
          </div>
        ) : files.some((f) => f.status === "failed") ? (
          <div className="mt-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium" style={{ background: "var(--danger-soft)", color: "var(--danger)", border: "1px solid color-mix(in srgb, var(--danger) 25%, transparent)" }}>
            <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{files.filter((f) => f.status === "failed").length} file(s) failed vectorization.</span>
          </div>
        ) : null}
      </Card>

      {/* Upload + SharePoint */}
      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <Card className="flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Upload Documents</h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>PDFs, DOCX, TXT, CSV, XLSX, and images.</p>
            </div>
            <div {...getRootProps()}
              className={`rounded-lg border-2 border-dashed p-8 text-center transition-colors cursor-pointer flex flex-col items-center justify-center min-h-40 ${
                isDragActive ? "border-[var(--accent)]" : ""
              }`}
              style={{ borderColor: isDragActive ? "var(--accent)" : "var(--border-default)", background: isDragActive ? "var(--accent-soft)" : "var(--bg-secondary)" }}
            >
              <input {...getInputProps()} />
              <svg className="h-8 w-8 mb-2" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <p className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                {isDragActive ? "Release to drop files..." : "Drag files here or click to browse"}
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>Text content parses automatically.</p>
            </div>

            {uploadProgress > 0 ? (
              <div className="mt-4">
                <div className="flex justify-between text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
                  <span>{isUploading ? "Uploading & Parsing" : "Complete"}</span>
                  <span style={{ color: "var(--accent)" }}>{uploadProgress}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-tertiary)" }}>
                  <div className="h-full rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%`, background: "var(--gradient-primary)" }} />
                </div>
              </div>
            ) : null}

            {Object.keys(fileTypeBreakdown).length ? (
              <div className="mt-6 pt-4 border-t" style={{ borderColor: "var(--border-default)" }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--text-muted)" }}>Indexed Files</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {Object.entries(fileTypeBreakdown).map(([type, count]) => (
                    <div key={type} className="card p-3 !shadow-none">
                      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{type}</p>
                      <p className="text-lg font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>{count}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          {message ? (
            <p className="mt-4 rounded-lg px-4 py-3 text-sm" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-default)", color: "var(--text-muted)" }}>
              {message}
            </p>
          ) : null}
        </Card>

        {/* SharePoint */}
        <Card className="flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>SharePoint Crawler</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Fetch specification rules from web nodes.</p>
            <div className="mt-5 flex flex-col gap-3">
              <input className="input-modern w-full px-4 py-3 text-sm" placeholder="Paste SharePoint link..." value={sharePointUrl}
                onChange={(event) => setSharePointUrl(event.target.value)}
              />
              <button className="btn-primary px-4 py-3 text-sm font-semibold" disabled={isUploading} onClick={addSharePointDocument} type="button">
                Download Document
              </button>
            </div>
          </div>
        </Card>
      </div>

      {/* File List */}
      <Card className="p-0 overflow-hidden">
        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between border-b" style={{ borderColor: "var(--border-default)" }}>
          <div>
            <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Knowledge Files</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Query status indicators and index variables.</p>
          </div>
          <div className="relative w-full sm:max-w-xs">
            <input className="input-modern w-full pl-9 pr-3 py-2 text-sm" placeholder="Search..." value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <svg className="absolute left-3 top-2.5 h-4 w-4" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3 p-5">
            {[1, 2, 3].map((item) => <div key={item} className="h-14 shimmer-bg rounded-lg" />)}
          </div>
        ) : files.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>File Name</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Type</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Source</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-center" style={{ color: "var(--text-muted)" }}>Chunks</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Upload Date</th>
                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Status</th>
                  <th className="px-5 py-3 text-right" style={{ color: "var(--text-muted)" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {files.map((file) => {
                  const style = fileIcons[file.file_type] ?? { label: "FILE", color: "badge" };
                  return (
                    <tr key={file.id} className="transition-colors hover:bg-[var(--accent-soft)]" style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className={`badge ${style.color}`}>{style.label}</span>
                          <span className="font-medium truncate max-w-[250px]" style={{ color: "var(--text-primary)" }}>{file.file_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-sm" style={{ color: "var(--text-secondary)" }}>{file.file_type}</td>
                      <td className="px-5 py-3.5 capitalize" style={{ color: "var(--text-secondary)" }}>{file.source_type}</td>
                      <td className="px-5 py-3.5 text-center font-semibold font-mono" style={{ color: "var(--text-primary)" }}>{file.chunk_count ?? 0}</td>
                      <td className="px-5 py-3.5" style={{ color: "var(--text-secondary)" }}>{formatDate(file.upload_date)}</td>
                      <td className="px-5 py-3.5">
                        <span className={`badge ${
                          file.status === "ready" ? "badge-success" :
                          file.status === "failed" ? "badge-danger" : "badge-warning"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full mr-1 ${
                            file.status === "ready" ? "bg-[var(--success)]" :
                            file.status === "failed" ? "bg-[var(--danger)]" : "bg-[var(--warning)] animate-pulse"
                          }`} />
                          {file.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button className="btn-ghost px-3 py-1 text-xs" style={{ color: "var(--danger)" }}
                          onClick={() => setFilePendingDelete(file)} type="button"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <svg className="h-10 w-10 mx-auto mb-2" style={{ color: "var(--text-muted)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0V9a2 2 0 00-2-2M4 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>No knowledge source uploaded</p>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Upload relevant documents above to feed contexts into the generative pipeline.</p>
          </div>
        )}
      </Card>

      <ConfirmDeleteFileDialog
        fileName={filePendingDelete?.file_name ?? ""}
        open={!!filePendingDelete}
        onCancel={() => setFilePendingDelete(null)}
        onConfirm={() => {
          if (!filePendingDelete) return;
          const fileId = filePendingDelete.id;
          setFilePendingDelete(null);
          void deleteFile(fileId);
        }}
      />
    </div>
  );
}

function ConfirmDeleteFileDialog({ fileName, open, onCancel, onConfirm }: { fileName: string; open: boolean; onCancel: () => void; onConfirm: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4" role="dialog" aria-modal="true" aria-labelledby="delete-file-title">
      <div className="absolute inset-0" style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={onCancel} />
      <div className="relative w-full max-w-sm card p-6 animate-fade-in">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "var(--danger-soft)" }}>
          <svg className="h-6 w-6" style={{ color: "var(--danger)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 id="delete-file-title" className="text-center text-lg font-bold" style={{ color: "var(--text-primary)" }}>Delete Knowledge File?</h2>
        <p className="mt-2 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          Are you sure you want to delete &ldquo;{fileName}&rdquo;? This will remove the file and its generated chunks.
        </p>
        <div className="mt-6 flex gap-3">
          <button className="btn-secondary flex-1 py-2.5 text-sm font-semibold" onClick={onCancel} type="button">Cancel</button>
          <button className="btn-danger flex-1 py-2.5 text-sm font-semibold" onClick={onConfirm} type="button">Delete</button>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{label}</p>
        <p className="text-2xl font-bold mt-1" style={{ color: "var(--text-primary)" }}>{value}</p>
      </div>
    </Card>
  );
}
