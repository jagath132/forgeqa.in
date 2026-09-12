/* ─── Phase metadata ───────────────────────────────────────────────── */
const PHASES = [
  {
    key: 'knowledge',
    label: 'Knowledge Retrieval',
    sub: 'Vector search & scoring',
    icon: '⚡',
  },
  {
    key: 'prompt',
    label: 'Prompt Assembly',
    sub: 'Context injection',
    icon: '🧩',
  },
  {
    key: 'generating',
    label: 'Matrix Synthesis',
    sub: 'LLM inference & parsing',
    icon: '✦',
  },
] as const;

/* ─── Orb spinner ──────────────────────────────────────────────────── */
function AIOrb() {
  return (
    <div style={{ position: 'relative', width: 88, height: 88, flexShrink: 0 }}>
      <style>{`
        @keyframes orb-spin-1 { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes orb-spin-2 { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes orb-pulse  { 0%,100% { opacity:0.7; transform:scale(1); } 50% { opacity:1; transform:scale(1.08); } }
        @keyframes slide-up-fade { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes progress-fill { from { width:0%; } to { width:100%; } }
        @keyframes blink-dot { 0%,80%,100%{ opacity:0; } 40%{ opacity:1; } }
      `}</style>

      {/* Outer ring */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '2px solid transparent',
          borderTopColor: '#818cf8',
          borderRightColor: '#22d3ee',
          animation: 'orb-spin-1 2s linear infinite',
        }}
      />
      {/* Middle ring */}
      <div
        style={{
          position: 'absolute',
          inset: 10,
          borderRadius: '50%',
          border: '2px solid transparent',
          borderBottomColor: '#a78bfa',
          borderLeftColor: '#34d399',
          animation: 'orb-spin-2 1.4s linear infinite',
        }}
      />
      {/* Core orb */}
      <div
        style={{
          position: 'absolute',
          inset: 20,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #818cf8 0%, #22d3ee 50%, #a78bfa 100%)',
          boxShadow: '0 0 30px rgba(129,140,248,0.6), 0 0 60px rgba(34,211,238,0.3)',
          animation: 'orb-pulse 2s ease-in-out infinite',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ fontSize: '16px' }}>✦</span>
      </div>
    </div>
  );
}

/* ─── Phase stepper ────────────────────────────────────────────────── */
function PhaseStepper({ currentPhase }: { currentPhase: string | null }) {
  const currentIndex = PHASES.findIndex((p) => p.key === currentPhase);

  return (
    <div style={{ width: '100%', maxWidth: 520, position: 'relative', padding: '0 8px' }}>
      {/* Track line */}
      <div
        style={{
          position: 'absolute',
          top: 13,
          left: '10%',
          right: '10%',
          height: '2px',
          background: 'rgba(99,102,241,0.15)',
          borderRadius: '2px',
        }}
      />
      {/* Progress fill */}
      <div
        style={{
          position: 'absolute',
          top: 13,
          left: '10%',
          height: '2px',
          borderRadius: '2px',
          background: 'linear-gradient(90deg, #818cf8, #22d3ee)',
          boxShadow: '0 0 8px rgba(34,211,238,0.5)',
          transition: 'width 0.6s ease',
          width:
            currentIndex < 0 ? '0%' : currentIndex === 0 ? '0%' : currentIndex === 1 ? '40%' : '80%',
        }}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
        {PHASES.map((phase, idx) => {
          const isActive = idx === currentIndex;
          const isDone = idx < currentIndex;

          return (
            <div
              key={phase.key}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', flex: 1 }}
            >
              {/* Step dot */}
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  background: isDone
                    ? 'linear-gradient(135deg, #34d399, #059669)'
                    : isActive
                    ? 'linear-gradient(135deg, #818cf8, #22d3ee)'
                    : 'rgba(30,41,59,0.8)',
                  border: isDone
                    ? '2px solid rgba(52,211,153,0.4)'
                    : isActive
                    ? '2px solid rgba(129,140,248,0.5)'
                    : '2px solid rgba(99,102,241,0.2)',
                  boxShadow: isActive ? '0 0 16px rgba(129,140,248,0.5)' : 'none',
                  transition: 'all 0.4s ease',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                {isDone ? '✓' : isActive ? (
                  <span
                    style={{
                      display: 'inline-block',
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#fff',
                      animation: 'orb-pulse 1s ease-in-out infinite',
                    }}
                  />
                ) : (
                  <span style={{ color: 'rgba(148,163,184,0.4)', fontSize: '10px' }}>{idx + 1}</span>
                )}
              </div>

              {/* Label */}
              <div style={{ textAlign: 'center', maxWidth: 110 }}>
                <p
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    color: isDone ? '#34d399' : isActive ? '#e2e8f0' : '#475569',
                    margin: 0,
                    lineHeight: 1.3,
                    transition: 'color 0.3s',
                  }}
                >
                  {phase.label}
                </p>
                <p
                  style={{
                    fontSize: '10px',
                    color: isActive ? '#64748b' : '#334155',
                    margin: '2px 0 0',
                    lineHeight: 1.2,
                    transition: 'color 0.3s',
                  }}
                >
                  {phase.sub}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main component ───────────────────────────────────────────────── */
export function GeneratingLoader({
  phase,
  streamingText: _streamingText,
  onCancel: _onCancel,
}: {
  phase: string | null;
  streamingText?: string;
  onCancel?: () => void;
}) {
  const phaseLabel =
    phase === 'complete'
      ? 'Generation complete!'
      : phase === 'error'
      ? 'Generation failed'
      : phase === 'connecting'
      ? 'Connecting to AI...'
      : 'Generating Test Matrix';

  const phaseSubLabel =
    phase === 'complete'
      ? 'All test cases are ready'
      : phase === 'error'
      ? 'An error occurred during generation'
      : phase === 'connecting'
      ? 'Establishing secure stream connection'
      : 'ForgeQA AI is synthesizing your test cases';

  return (
    <div
      style={{
        borderRadius: '20px',
        padding: '36px 32px 32px',
        background: 'linear-gradient(160deg, rgba(17,24,39,0.97) 0%, rgba(9,14,27,0.99) 100%)',
        border: '1px solid rgba(99,102,241,0.2)',
        boxShadow:
          '0 0 0 1px rgba(255,255,255,0.03), 0 20px 60px rgba(0,0,0,0.5), 0 0 80px rgba(99,102,241,0.06)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '32px',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow backdrop */}
      <div
        style={{
          position: 'absolute',
          top: -40,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 400,
          height: 200,
          background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Hero section: orb + title ── */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', zIndex: 1 }}>
        <AIOrb />

        <div style={{ textAlign: 'center' }}>
          <h2
            style={{
              fontSize: '20px',
              fontWeight: 700,
              margin: '0 0 6px',
              background: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
            }}
          >
            {phaseLabel}
          </h2>
          <p style={{ fontSize: '13px', color: '#475569', margin: 0 }}>{phaseSubLabel}</p>
        </div>
      </div>

      {/* ── Phase stepper ── */}
      {!['complete', 'error', 'connecting'].includes(phase ?? '') && (
        <PhaseStepper currentPhase={phase} />
      )}
    </div>
  );
}
