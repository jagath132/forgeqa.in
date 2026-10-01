import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../lib/api';
import { Bell, X, AlertTriangle, CheckCircle, ChevronRight, RefreshCw, Zap } from 'lucide-react';

interface ModelAlert {
  _id: string;
  provider: string;
  model: string;
  replacement: string | null;
  reason: string;
  createdAt: string;
}

const PROVIDER_COLORS: Record<string, string> = {
  gemini: '#4285F4',
  openai: '#10A37F',
  groq: '#F55036',
  claude: '#D4A843',
  openrouter: '#8B5CF6',
  opencode: '#64748B',
};

const PROVIDER_LABELS: Record<string, string> = {
  gemini: 'Google Gemini',
  openai: 'OpenAI',
  groq: 'Groq',
  claude: 'Anthropic Claude',
  openrouter: 'OpenRouter',
  opencode: 'OpenCode',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export function ModelAlertBanner() {
  const [alerts, setAlerts] = useState<ModelAlert[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    api
      .get('/api/ai/model-alerts')
      .then((res) => {
        const a = res.data?.alerts ?? [];
        setAlerts(a);
        if (a.length > 0) setVisible(true);
      })
      .catch(() => {});
  }, []);

  const dismiss = async (id: string) => {
    await api.post(`/api/ai/model-alerts/${id}/dismiss`).catch(() => {});
    setAlerts((prev) => prev.filter((a) => a._id !== id));
    if (alerts.length <= 1) setVisible(false);
  };

  const dismissAll = async () => {
    await api.post('/api/ai/model-alerts/dismiss-all').catch(() => {});
    setAlerts([]);
    setVisible(false);
  };

  if (!visible || alerts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        maxWidth: 420,
        width: '100%',
      }}
    >
      {alerts.map((alert) => (
        <div
          key={alert._id}
          style={{
            background: 'linear-gradient(135deg, #1e1b4b 0%, #2d1b69 100%)',
            border: '1px solid rgba(239,68,68,0.4)',
            borderLeft: `4px solid ${PROVIDER_COLORS[alert.provider] ?? '#EF4444'}`,
            borderRadius: 12,
            padding: '14px 16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            backdropFilter: 'blur(12px)',
            position: 'relative',
            color: '#fff',
            animation: 'slideInRight 0.3s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          <button
            onClick={() => dismiss(alert._id)}
            style={{
              position: 'absolute',
              top: 10,
              right: 10,
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              borderRadius: 6,
              width: 24,
              height: 24,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.7)',
            }}
            aria-label="Dismiss alert"
          >
            <X size={13} />
          </button>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: `${PROVIDER_COLORS[alert.provider] ?? '#EF4444'}22`,
                border: `1px solid ${PROVIDER_COLORS[alert.provider] ?? '#EF4444'}55`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={16} color={PROVIDER_COLORS[alert.provider] ?? '#EF4444'} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#fca5a5', marginBottom: 2 }}>
                ⚠️ Model Deprecated — {PROVIDER_LABELS[alert.provider] ?? alert.provider}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.85)',
                  lineHeight: 1.5,
                  wordBreak: 'break-word',
                }}
              >
                {alert.reason}
              </div>
            </div>
          </div>

          {alert.replacement && (
            <div
              style={{
                background: 'rgba(16,185,129,0.12)',
                border: '1px solid rgba(16,185,129,0.3)',
                borderRadius: 8,
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 4,
                marginBottom: 6,
              }}
            >
              <CheckCircle size={14} color="#34d399" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: '#a7f3d0' }}>
                Auto-updated to <strong style={{ color: '#34d399' }}>{alert.replacement}</strong>
              </span>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 4,
            }}
          >
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
              {timeAgo(alert.createdAt)}
            </span>
            <a
              href="/settings?tab=ai"
              style={{
                fontSize: 11,
                color: '#a78bfa',
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontWeight: 500,
              }}
            >
              Go to AI Settings <ChevronRight size={12} />
            </a>
          </div>
        </div>
      ))}

      {alerts.length > 1 && (
        <button
          onClick={dismissAll}
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8,
            padding: '8px 14px',
            color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer',
            fontSize: 12,
            textAlign: 'center',
          }}
        >
          Dismiss all {alerts.length} alerts
        </button>
      )}

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(32px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

// ── Notification Bell Panel ─────────────────────────────────────────────────

interface ModelAlertBellProps {
  className?: string;
}

export function ModelAlertBell({ className }: ModelAlertBellProps) {
  const [alerts, setAlerts] = useState<ModelAlert[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await api.get('/api/ai/model-alerts');
      setAlerts(res.data?.alerts ?? []);
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000); // re-poll every 5 min
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  // Close panel on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    }
    if (panelOpen) document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [panelOpen]);

  const triggerCheck = async () => {
    setChecking(true);
    try {
      await api.post('/api/ai/check-model', {});
      await fetchAlerts();
    } catch {
      // silent
    } finally {
      setChecking(false);
    }
  };

  const dismiss = async (id: string) => {
    await api.post(`/api/ai/model-alerts/${id}/dismiss`).catch(() => {});
    setAlerts((prev) => prev.filter((a) => a._id !== id));
  };

  const dismissAll = async () => {
    await api.post('/api/ai/model-alerts/dismiss-all').catch(() => {});
    setAlerts([]);
  };

  const count = alerts.length;

  return (
    <div ref={panelRef} style={{ position: 'relative' }} className={className}>
      {/* Bell Button */}
      <button
        id="model-alert-bell"
        type="button"
        onClick={() => setPanelOpen((p) => !p)}
        title={count > 0 ? `${count} AI model alert${count > 1 ? 's' : ''}` : 'AI model status'}
        style={{
          position: 'relative',
          width: 36,
          height: 36,
          borderRadius: 8,
          border: count > 0 ? '1px solid rgba(239,68,68,0.4)' : '1px solid transparent',
          background: count > 0 ? 'rgba(239,68,68,0.08)' : 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.2s',
          color: count > 0 ? '#EF4444' : '#64748b',
        }}
      >
        <Bell size={18} />
        {count > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 6,
              right: 6,
              width: 8,
              height: 8,
              background: '#EF4444',
              borderRadius: '50%',
              boxShadow: '0 0 0 2px white',
              animation: 'pulse 2s infinite',
            }}
          />
        )}
      </button>

      {/* Dropdown Panel */}
      {panelOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: 380,
            background: 'linear-gradient(160deg, #0f172a 0%, #1e1b4b 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 14,
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            overflow: 'hidden',
            zIndex: 9000,
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 16px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={15} color="#a78bfa" />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#f1f5f9' }}>
                AI Model Health
              </span>
              {count > 0 && (
                <span
                  style={{
                    background: '#EF4444',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 700,
                    borderRadius: 20,
                    padding: '1px 7px',
                  }}
                >
                  {count}
                </span>
              )}
            </div>
            <button
              onClick={triggerCheck}
              disabled={checking}
              title="Run live model check now"
              style={{
                background: 'rgba(167,139,250,0.1)',
                border: '1px solid rgba(167,139,250,0.2)',
                borderRadius: 6,
                cursor: checking ? 'not-allowed' : 'pointer',
                color: '#a78bfa',
                padding: '4px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 11,
                fontWeight: 500,
              }}
            >
              <RefreshCw
                size={12}
                style={{ animation: checking ? 'spin 1s linear infinite' : 'none' }}
              />
              {checking ? 'Checking…' : 'Check now'}
            </button>
          </div>

          {/* Body */}
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            {count === 0 ? (
              <div
                style={{
                  padding: '32px 16px',
                  textAlign: 'center',
                  color: 'rgba(255,255,255,0.4)',
                  fontSize: 13,
                }}
              >
                <CheckCircle size={28} color="#34d399" style={{ marginBottom: 10, opacity: 0.7 }} />
                <div style={{ fontWeight: 500, color: '#a7f3d0', marginBottom: 4 }}>
                  All AI models are healthy
                </div>
                <div style={{ fontSize: 11 }}>
                  ForgeQA checks for deprecations every 24 hours automatically.
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {alerts.map((alert, i) => (
                  <div
                    key={alert._id}
                    style={{
                      padding: '12px 16px',
                      borderBottom:
                        i < alerts.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                      display: 'flex',
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 8,
                        background: `${PROVIDER_COLORS[alert.provider] ?? '#EF4444'}18`,
                        border: `1px solid ${PROVIDER_COLORS[alert.provider] ?? '#EF4444'}40`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <AlertTriangle
                        size={15}
                        color={PROVIDER_COLORS[alert.provider] ?? '#EF4444'}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#fca5a5',
                          marginBottom: 3,
                        }}
                      >
                        {PROVIDER_LABELS[alert.provider] ?? alert.provider} — Model Deprecated
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: 'rgba(255,255,255,0.6)',
                          lineHeight: 1.5,
                          marginBottom: 4,
                          wordBreak: 'break-word',
                        }}
                      >
                        {alert.reason}
                      </div>
                      {alert.replacement && (
                        <div
                          style={{
                            fontSize: 11,
                            color: '#34d399',
                            fontWeight: 500,
                          }}
                        >
                          ✓ Auto-switched to {alert.replacement}
                        </div>
                      )}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: 6,
                        }}
                      >
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                          {timeAgo(alert.createdAt)}
                        </span>
                        <button
                          onClick={() => dismiss(alert._id)}
                          style={{
                            fontSize: 10,
                            color: 'rgba(255,255,255,0.35)',
                            cursor: 'pointer',
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            textDecoration: 'underline',
                          }}
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {count > 0 && (
            <div
              style={{
                padding: '10px 16px',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <a
                href="/settings?tab=ai"
                style={{
                  fontSize: 11,
                  color: '#a78bfa',
                  textDecoration: 'none',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                Update AI settings <ChevronRight size={12} />
              </a>
              <button
                onClick={dismissAll}
                style={{
                  fontSize: 11,
                  color: 'rgba(255,255,255,0.35)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Dismiss all
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
