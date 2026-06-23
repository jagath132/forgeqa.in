export function FloatingShapes3D() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Cube */}
      <div className="shape-3d-container absolute top-[15%] left-[8%]">
        <div className="shape-cube" style={{ width: 60, height: 60 }}>
          <div className="shape-cube-face shape-cube-face-front" style={{ background: "rgba(99,102,241,0.08)", borderColor: "rgba(99,102,241,0.3)" }} />
          <div className="shape-cube-face shape-cube-face-back" style={{ background: "rgba(99,102,241,0.06)", borderColor: "rgba(99,102,241,0.2)" }} />
          <div className="shape-cube-face shape-cube-face-right" style={{ background: "rgba(139,92,246,0.08)", borderColor: "rgba(139,92,246,0.3)" }} />
          <div className="shape-cube-face shape-cube-face-left" style={{ background: "rgba(139,92,246,0.06)", borderColor: "rgba(139,92,246,0.2)" }} />
          <div className="shape-cube-face shape-cube-face-top" style={{ background: "rgba(99,102,241,0.1)", borderColor: "rgba(99,102,241,0.35)" }} />
          <div className="shape-cube-face shape-cube-face-bottom" style={{ background: "rgba(99,102,241,0.04)", borderColor: "rgba(99,102,241,0.15)" }} />
        </div>
      </div>

      {/* Sphere 1 */}
      <div className="absolute top-[25%] right-[12%]" style={{ animation: "spherePulse 5s ease-in-out infinite" }}>
        <div className="shape-sphere" style={{
          width: 100, height: 100,
          background: "radial-gradient(circle at 35% 35%, rgba(244,63,94,0.15), rgba(244,63,94,0.05))",
          boxShadow: "0 0 60px rgba(244,63,94,0.08)",
          border: "1px solid rgba(244,63,94,0.12)",
        }} />
      </div>

      {/* Ring */}
      <div className="absolute bottom-[30%] left-[5%]">
        <div className="shape-ring" style={{
          width: 80, height: 80,
          borderColor: "rgba(6,182,212,0.2)",
          boxShadow: "0 0 30px rgba(6,182,212,0.06)",
        }} />
      </div>

      {/* Small floating spheres */}
      <div className="absolute top-[60%] right-[20%]" style={{ animation: "floatSlow 7s ease-in-out infinite" }}>
        <div style={{
          width: 16, height: 16, borderRadius: "50%",
          background: "rgba(34,197,94,0.2)",
          boxShadow: "0 0 20px rgba(34,197,94,0.1)",
        }} />
      </div>

      <div className="absolute top-[40%] left-[45%]" style={{ animation: "floatSlow 9s ease-in-out infinite", animationDelay: "-2s" }}>
        <div style={{
          width: 10, height: 10, borderRadius: "50%",
          background: "rgba(139,92,246,0.2)",
          boxShadow: "0 0 15px rgba(139,92,246,0.1)",
        }} />
      </div>

      <div className="absolute bottom-[20%] right-[35%]" style={{ animation: "floatSlow 8s ease-in-out infinite", animationDelay: "-4s" }}>
        <div style={{
          width: 12, height: 12, borderRadius: "50%",
          background: "rgba(244,63,94,0.2)",
          boxShadow: "0 0 15px rgba(244,63,94,0.1)",
        }} />
      </div>

      {/* Tetrahedron - top center */}
      <div className="shape-3d-container absolute top-[10%] left-[55%]">
        <svg width="50" height="50" viewBox="0 0 50 50" style={{ animation: "tetraRotate 15s linear infinite" }}>
          <polygon points="25,2 48,38 2,38" fill="rgba(99,102,241,0.04)" stroke="rgba(99,102,241,0.2)" strokeWidth="1" />
          <polygon points="25,2 48,38 25,30" fill="rgba(139,92,246,0.04)" stroke="rgba(139,92,246,0.15)" strokeWidth="0.5" />
          <polygon points="25,2 2,38 25,30" fill="rgba(99,102,241,0.02)" stroke="rgba(99,102,241,0.15)" strokeWidth="0.5" />
          <polygon points="2,38 48,38 25,30" fill="rgba(99,102,241,0.02)" stroke="rgba(99,102,241,0.1)" strokeWidth="0.5" />
        </svg>
      </div>

      {/* Pyramid - bottom left area */}
      <div className="shape-3d-container absolute bottom-[15%] left-[20%]">
        <svg width="40" height="40" viewBox="0 0 40 40" style={{ animation: "pyramidFloat 8s ease-in-out infinite", transformOrigin: "center" }}>
          <polygon points="20,2 38,36 2,36" fill="rgba(6,182,212,0.04)" stroke="rgba(6,182,212,0.15)" strokeWidth="0.8" />
          <line x1="20" y1="2" x2="20" y2="36" stroke="rgba(6,182,212,0.1)" strokeWidth="0.5" />
        </svg>
      </div>

      {/* Glow orbs */}
      <div className="absolute top-[5%] right-[30%]" style={{ animation: "spherePulse 4s ease-in-out infinite" }}>
        <div className="shape-glow" style={{
          width: 200, height: 200, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.03), transparent)",
          color: "rgba(99,102,241,0.1)",
        }} />
      </div>
      <div className="absolute bottom-[5%] right-[10%]" style={{ animation: "spherePulse 6s ease-in-out infinite", animationDelay: "-2s" }}>
        <div className="shape-glow" style={{
          width: 150, height: 150, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(244,63,94,0.03), transparent)",
          color: "rgba(244,63,94,0.08)",
        }} />
      </div>
    </div>
  );
}
