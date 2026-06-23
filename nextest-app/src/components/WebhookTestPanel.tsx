import { useState } from "react";
import { Card } from "./ui/Card";


export function WebhookTestPanel({ webhooks }: { webhooks: { platform: string; url: string }[] }) {
  const [testResult, setTestResult] = useState<string>("");
  const [testing, setTesting] = useState(false);

  async function testWebhook(platform: string, url: string) {
    setTesting(true);
    setTestResult("");
    try {
      const payload = {
        event: "build_complete",
        platform,
        version: "test-" + Date.now(),
        timestamp: new Date().toISOString(),
        status: "success",
        artifact: { fileName: "test-build.zip", fileSize: 1024 },
      };
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setTestResult(`Status: ${res.status} ${res.statusText}`);
    } catch (err) {
      setTestResult(`Error: ${err instanceof Error ? err.message : "Request failed"}`);
    } finally {
      setTesting(false);
    }
  }

  if (!webhooks.length) return null;

  return (
    <Card>
      <h3 className="text-sm font-bold mb-3" style={{ color: "var(--text-primary)" }}>Webhook Test Panel</h3>
      <div className="space-y-2">
        {webhooks.map((w) => (
          <div key={w.platform} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2" style={{ background: "var(--bg-secondary)" }}>
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-xs font-semibold uppercase shrink-0" style={{ color: "var(--accent)" }}>{w.platform}</span>
              <span className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{w.url}</span>
            </div>
            <button
              onClick={() => testWebhook(w.platform, w.url)}
              disabled={testing}
              className="btn-secondary px-3 py-1 text-xs font-semibold cursor-pointer shrink-0"
              type="button"
            >
              {testing ? "Sending..." : "Test"}
            </button>
          </div>
        ))}
      </div>
      {testResult && (
        <p className="mt-2 text-xs font-medium" style={{ color: testResult.startsWith("Status: 2") ? "var(--success)" : "var(--danger)" }}>
          {testResult}
        </p>
      )}
    </Card>
  );
}
