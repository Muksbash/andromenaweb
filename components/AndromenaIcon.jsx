import { useEffect, useRef } from "react";

/**
 * AndromenaIcon
 * @param {number} size - icon size in px (default 32)
 * @param {string} bg   - background color (default "transparent")
 */
export default function AndromenaIcon({ size = 32, bg = "transparent" }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const S = size;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = S * dpr;
    canvas.height = S * dpr;
    canvas.style.width = S + "px";
    canvas.style.height = S + "px";
    ctx.scale(dpr, dpr);

    const cx = S / 2;
    const cy = S / 2;
    const R = S * 0.42;

    const ps = { x: cx - S * 0.30, y: cy + S * 0.30 };
    const pc = { x: cx - S * 0.05, y: cy + S * 0.02 };
    const pe = { x: cx + S * 0.24, y: cy - S * 0.24 };

    function bezierPoint(t) {
      const mt = 1 - t;
      return {
        x: mt * mt * ps.x + 2 * mt * t * pc.x + t * t * pe.x,
        y: mt * mt * ps.y + 2 * mt * t * pc.y + t * t * pe.y,
      };
    }

    const particles = Array.from({ length: 30 }, (_, i) => {
      const t = 0.02 + (i / 29) * 0.80;
      const p = bezierPoint(t);
      return {
        x: p.x + (Math.random() - 0.5) * S * 0.04,
        y: p.y + (Math.random() - 0.5) * S * 0.04,
        r: (0.3 + t * 1.6) * (S / 140),
        baseAlpha: 0.08 + t * 0.38,
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.8,
      };
    });

    let time = 0;

    function draw() {
      ctx.clearRect(0, 0, S, S);

      // Background
      if (bg && bg !== "transparent") {
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, S, S);
      }

      // Circle frame
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.13)";
      ctx.lineWidth = Math.max(0.5, S * 0.004);
      ctx.stroke();

      // Tail glow layers
      const tailGrad = ctx.createLinearGradient(ps.x, ps.y, pe.x, pe.y);
      tailGrad.addColorStop(0, "rgba(255,255,255,0)");
      tailGrad.addColorStop(0.5, "rgba(255,255,255,0.06)");
      tailGrad.addColorStop(1, "rgba(255,255,255,0.22)");

      ctx.beginPath();
      ctx.moveTo(ps.x, ps.y);
      ctx.quadraticCurveTo(pc.x, pc.y, pe.x, pe.y);
      ctx.strokeStyle = tailGrad;
      ctx.lineWidth = S * 0.11;
      ctx.lineCap = "round";
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(ps.x, ps.y);
      ctx.quadraticCurveTo(pc.x, pc.y, pe.x, pe.y);
      ctx.strokeStyle = "rgba(255,255,255,0.09)";
      ctx.lineWidth = S * 0.055;
      ctx.lineCap = "round";
      ctx.stroke();

      // Bright core line with gradient
      const coreGrad = ctx.createLinearGradient(ps.x, ps.y, pe.x, pe.y);
      coreGrad.addColorStop(0, "rgba(255,255,255,0)");
      coreGrad.addColorStop(0.3, "rgba(255,255,255,0.25)");
      coreGrad.addColorStop(0.7, "rgba(255,255,255,0.75)");
      coreGrad.addColorStop(1, "rgba(255,255,255,1)");

      ctx.beginPath();
      ctx.moveTo(ps.x, ps.y);
      ctx.quadraticCurveTo(pc.x, pc.y, pe.x, pe.y);
      ctx.strokeStyle = coreGrad;
      ctx.lineWidth = S * 0.013;
      ctx.lineCap = "round";
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(ps.x, ps.y);
      ctx.quadraticCurveTo(pc.x, pc.y, pe.x, pe.y);
      ctx.strokeStyle = "rgba(255,255,255,0.55)";
      ctx.lineWidth = S * 0.004;
      ctx.lineCap = "round";
      ctx.stroke();

      // Particles
      particles.forEach((p) => {
        const flicker = 0.8 + 0.2 * Math.sin(time * p.speed + p.phase);
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.baseAlpha * flicker})`;
        ctx.fill();
      });

      // Head halos
      const pulse = 1 + 0.05 * Math.sin(time * 1.1);
      [
        [S * 0.16 * pulse, 0.025],
        [S * 0.10 * pulse, 0.07],
        [S * 0.065 * pulse, 0.14],
        [S * 0.038 * pulse, 0.28],
      ].forEach(([r, a]) => {
        const g = ctx.createRadialGradient(pe.x, pe.y, 0, pe.x, pe.y, r);
        g.addColorStop(0, `rgba(255,255,255,${a})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.beginPath();
        ctx.arc(pe.x, pe.y, r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      });

      // Head core
      ctx.beginPath();
      ctx.arc(pe.x, pe.y, S * 0.034, 0, Math.PI * 2);
      ctx.fillStyle = "white";
      ctx.fill();

      // Glint
      ctx.beginPath();
      ctx.arc(pe.x + S * 0.014, pe.y - S * 0.014, S * 0.012, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.fill();

      // Orbiting dot
      const oa = time * 0.38 - Math.PI * 0.58;
      const ox = cx + R * Math.cos(oa);
      const oy = cy + R * Math.sin(oa);
      const distToHead = Math.hypot(ox - pe.x, oy - pe.y);
      const orbitAlpha = Math.min(1, distToHead / (S * 0.18)) * 0.6;

      for (let i = 5; i >= 1; i--) {
        const ta = oa - i * 0.065;
        const tx = cx + R * Math.cos(ta);
        const ty = cy + R * Math.sin(ta);
        ctx.beginPath();
        ctx.arc(tx, ty, S * 0.010 - i * S * 0.0015, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${orbitAlpha * (0.3 - i * 0.05)})`;
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(ox, oy, S * 0.018, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${orbitAlpha})`;
      ctx.fill();

      time += 0.016;
      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [size, bg]);

  return (
    <canvas
      ref={canvasRef}
      style={{ display: "block", flexShrink: 0 }}
    />
  );
}

// ─── USAGE EXAMPLES (delete these when copying into your project) ────────────
//
// Navbar:
//   <AndromenaIcon size={28} />
//
// Large hero / loading screen:
//   <AndromenaIcon size={120} />
//
// On a white background (e.g. business card, letterhead):
//   <AndromenaIcon size={32} bg="#ffffff" />
//
// With wordmark next to it:
//   <div style={{ display:"flex", alignItems:"center", gap:10 }}>
//     <AndromenaIcon size={28} />
//     <span style={{ color:"white", letterSpacing:5, fontSize:14 }}>ANDROMENA</span>
//   </div>
