import React, { useEffect, useRef } from 'react';

export interface DottedGlobeCanvasProps {
  isVisible?: boolean;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const DottedGlobeCanvas: React.FC<DottedGlobeCanvasProps> = ({
  isVisible = true,
  size = 360,
  className = '',
  style = {}
}) => {
  const globeCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = globeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    canvas.width = size;
    canvas.height = size;
    const radius = 105;

    const dots: { x: number; y: number; z: number; isContinent: boolean }[] = [];
    const phi = Math.PI * (3 - Math.sqrt(5));
    const totalDots = 480;

    for (let i = 0; i < totalDots; i++) {
      const y = 1 - (i / (totalDots - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = phi * i;

      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      const lat = Math.asin(y);
      const lon = Math.atan2(z, x);
      const continentCluster =
        Math.sin(lat * 3 + lon * 2) * Math.cos(lat * 2 - lon * 3) > -0.15;

      dots.push({
        x: x * radius,
        y: y * radius,
        z: z * radius,
        isContinent: continentCluster
      });
    }

    let rotY = 0;
    let t = 0;

    const render = () => {
      if (!isVisible) {
        animId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, size, size);
      const cx = size / 2;
      const cy = size / 2;

      t += 0.02;
      rotY += 0.008;

      // Deep Volumetric Glow
      const bgGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, 160);
      bgGrad.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
      bgGrad.addColorStop(0.5, 'rgba(16, 185, 129, 0.08)');
      bgGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = bgGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 160, 0, Math.PI * 2);
      ctx.fill();

      // Project & Render Globe Dots
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const tilt = 0.28;
      const cosX = Math.cos(tilt);
      const sinX = Math.sin(tilt);

      const projected = dots.map((p) => {
        const x1 = p.x * cosY + p.z * sinY;
        const z1 = -p.x * sinY + p.z * cosY;
        const y2 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX;

        const fov = 380;
        const scale = fov / (fov + z2);
        return {
          sx: cx + x1 * scale,
          sy: cy + y2 * scale,
          scale,
          z: z2,
          isContinent: p.isContinent
        };
      });

      projected.sort((a, b) => a.z - b.z);

      for (const pt of projected) {
        if (pt.z > -radius * 0.9) {
          ctx.beginPath();
          const dotRadius = Math.max(0.6, pt.scale * (pt.isContinent ? 1.6 : 0.9));
          ctx.arc(pt.sx, pt.sy, dotRadius, 0, Math.PI * 2);

          if (pt.z > 0 && pt.isContinent) {
            ctx.fillStyle = `rgba(207, 250, 254, ${0.4 + (pt.z / radius) * 0.6})`;
          } else if (pt.z > 0) {
            ctx.fillStyle = 'rgba(103, 232, 249, 0.5)';
          } else {
            ctx.fillStyle = 'rgba(148, 163, 184, 0.25)';
          }
          ctx.fill();
        }
      }

      // Orbital Ring 1
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.4);
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 1.35, radius * 0.42, 0, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Traveling Photon Node on Ring 1
      const px = Math.cos(t * 1.2) * radius * 1.35;
      const py = Math.sin(t * 1.2) * radius * 0.42;
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(px, py, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isVisible, size]);

  return (
    <div
      className={`l-dotted-globe-container ${className}`}
      style={{ position: 'relative', width: `${size}px`, height: `${size}px`, ...style }}
    >
      <canvas ref={globeCanvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};
