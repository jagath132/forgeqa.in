import { useState, useEffect, useCallback } from "react";
import { Card } from "./ui/Card";
import { uploadBuildArtifact, getLatestBuildArtifact, saveBuildWebhook, getBuildWebhooks, type RegressionBuildArtifact } from "../lib/api";

export function RegressionBuildManager() {
  const [activeTab, setActiveTab] = useState<"upload" | "webhook">("upload");
  const [platform, setPlatform] = useState<"android" | "web">("android");
  const [version, setVersion] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [savedWebhooks, setSavedWebhooks] = useState<{ platform: string; url: string }[]>([]);
  const [latestArtifact, setLatestArtifact] = useState<RegressionBuildArtifact | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    try {
      const [androidArtifact, webArtifact, webhooks] = await Promise.all([
        getLatestBuildArtifact("android"),
        getLatestBuildArtifact("web"),
        getBuildWebhooks(),
      ]);
      setLatestArtifact(androidArtifact || webArtifact);
      setSavedWebhooks(webhooks);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  async function handleUpload(event: React.FormEvent) {
    event.preventDefault();
    const fileInput = document.getElementById("build-file") as HTMLInputElement;
    if (!fileInput?.files?.length || !version.trim()) {
      setMessage("Select a file and enter a version.");
      return;
    }
    setIsUploading(true);
    setMessage("");
    try {
      const artifact = await uploadBuildArtifact(platform, version.trim(), fileInput.files[0]);
      setLatestArtifact(artifact);
      setMessage(`Uploaded ${artifact.fileName} (v${artifact.version})`);
      fileInput.value = "";
      setVersion("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleSaveWebhook() {
    if (!webhookUrl.trim()) { setMessage("Enter a webhook URL."); return; }
    try {
      await saveBuildWebhook(platform, webhookUrl.trim());
      setSavedWebhooks((prev) => {
        const filtered = prev.filter((w) => w.platform !== platform);
        return [...filtered, { platform, url: webhookUrl.trim() }];
      });
      setMessage("Webhook saved.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to save webhook.");
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>Build Artifacts</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Upload APK or web build, or configure CI/CD webhook.</p>
        </div>
      </div>

      {latestArtifact && (
        <div className="mb-4 flex items-center gap-3 rounded-lg px-4 py-3 text-sm" style={{ background: "var(--accent-soft)" }}>
          <svg className="h-5 w-5 shrink-0" style={{ color: "var(--accent)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span style={{ color: "var(--text-primary)" }}>
            Latest: <strong>{latestArtifact.fileName}</strong> (v{latestArtifact.version}) — {new Date(latestArtifact.uploadedAt).toLocaleDateString()}
          </span>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <button type="button" onClick={() => setActiveTab("upload")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${activeTab === "upload" ? "btn-primary" : "btn-ghost"}`}
        >Manual Upload</button>
        <button type="button" onClick={() => setActiveTab("webhook")}
          className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${activeTab === "webhook" ? "btn-primary" : "btn-ghost"}`}
        >CI/CD Webhook</button>
      </div>

      {activeTab === "upload" ? (
        <form onSubmit={handleUpload} className="space-y-3">
          <div className="flex gap-3">
            <select className="input-modern px-3 py-2 text-xs" value={platform} onChange={(e) => setPlatform(e.target.value as "android" | "web")}>
              <option value="android">Android (APK)</option>
              <option value="web">Web (ZIP)</option>
            </select>
            <input className="input-modern flex-1 px-3 py-2 text-xs" placeholder="Version (e.g. 2.1.0)" value={version} onChange={(e) => setVersion(e.target.value)} />
          </div>
          <div className="flex items-center gap-3">
            <input id="build-file" type="file" accept={platform === "android" ? ".apk" : ".zip"} className="input-modern flex-1 px-3 py-2 text-xs file:mr-3 file:py-1 file:px-3 file:rounded-lg file:text-xs file:font-semibold file:border-0" style={{}} />
            <button type="submit" disabled={isUploading} className="btn-primary px-5 py-2 text-xs font-semibold cursor-pointer">
              {isUploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-3">
            <select className="input-modern px-3 py-2 text-xs" value={platform} onChange={(e) => {
              setPlatform(e.target.value as "android" | "web");
              const existing = savedWebhooks.find((w) => w.platform === e.target.value);
              setWebhookUrl(existing?.url || "");
            }}>
              <option value="android">Android</option>
              <option value="web">Web</option>
            </select>
            <input className="input-modern flex-1 px-3 py-2 text-xs" placeholder="https://jenkins.example.com/generic-webhook-trigger/invoke" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} />
          </div>
          <button type="button" onClick={handleSaveWebhook} className="btn-primary px-5 py-2 text-xs font-semibold cursor-pointer">Save Webhook</button>
        </div>
      )}

      {message && (
        <p className="mt-3 text-xs font-medium" style={{ color: message.includes("failed") || message.includes("error") ? "var(--danger)" : "var(--success)" }}>
          {message}
        </p>
      )}
    </Card>
  );
}
