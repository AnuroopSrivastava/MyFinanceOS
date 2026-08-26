import React, { useEffect, useRef } from 'react';

export interface BrandMonogramCanvasProps {
  isVisible?: boolean;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const BrandMonogramCanvas: React.FC<BrandMonogramCanvasProps> = ({
  isVisible = true,
  size = 420,
  className = '',
  style = {}
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    canvas.width = size * 2;
    canvas.height = size * 2;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(2, 2);

    // Particle field around the logo
    const particles = Array.from({ length: 45 }, () => ({
      x: (Math.random() - 0.5) * 260,
      y: (Math.random() - 0.5) * 260,
      radius: Math.random() * 1.6 + 0.6,
      alpha: Math.random() * 0.7 + 0.3,
      speed: Math.random() * 0.4 + 0.2,
      angle: Math.random() * Math.PI * 2
    }));

    const render = () => {
      if (!isVisible) {
        animId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, size, size);
      const cx = size / 2;
      const cy = size / 2;
      const t = Date.now() * 0.0015;

      // 1. Deep Volumetric Ambient Cyan/Emerald Glow
      const bgGlow = ctx.createRadialGradient(cx, cy, 10, cx, cy, 190);
      bgGlow.addColorStop(0, 'rgba(6, 182, 212, 0.35)');
      bgGlow.addColorStop(0.4, 'rgba(20, 184, 166, 0.16)');
      bgGlow.addColorStop(0.8, 'rgba(16, 185, 129, 0.05)');
      bgGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = bgGlow;
      ctx.beginPath();
      ctx.arc(cx, cy, 190, 0, Math.PI * 2);
      ctx.fill();

      // 2. Drifting Star Particles
      particles.forEach((p) => {
        p.angle += p.speed * 0.01;
        const px = cx + p.x + Math.cos(p.angle) * 12;
        const py = cy + p.y + Math.sin(p.angle) * 12;
        ctx.fillStyle = `rgba(165, 243, 252, ${p.alpha * (0.6 + 0.4 * Math.sin(t * 2 + p.x))})`;
        ctx.beginPath();
        ctx.arc(px, py, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Dual Glowing Counter-Rotating Swoosh Arrows
      // Swoosh 1 (Upper arc with head pointing left-down)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t * 0.85);

      const arcGrad1 = ctx.createLinearGradient(-130, -50, 130, 50);
      arcGrad1.addColorStop(0, 'rgba(255, 255, 255, 0)');
      arcGrad1.addColorStop(0.5, 'rgba(103, 232, 249, 0.5)');
      arcGrad1.addColorStop(1, '#ffffff');

      ctx.beginPath();
      ctx.arc(0, 0, 120, Math.PI * 0.8, Math.PI * 1.95);
      ctx.strokeStyle = arcGrad1;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 12;
      ctx.stroke();

      // Arrow head 1
      const a1EndAngle = Math.PI * 1.95;
      const a1x = Math.cos(a1EndAngle) * 120;
      const a1y = Math.sin(a1EndAngle) * 120;
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(a1x + 8, a1y - 2);
      ctx.lineTo(a1x - 6, a1y - 9);
      ctx.lineTo(a1x - 2, a1y + 8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Swoosh 2 (Lower arc counter-rotating)
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-t * 0.85);

      const arcGrad2 = ctx.createLinearGradient(130, 50, -130, -50);
      arcGrad2.addColorStop(0, 'rgba(255, 255, 255, 0)');
      arcGrad2.addColorStop(0.5, 'rgba(16, 185, 129, 0.6)');
      arcGrad2.addColorStop(1, '#ffffff');

      ctx.beginPath();
      ctx.arc(0, 0, 120, Math.PI * 1.8, Math.PI * 2.95);
      ctx.strokeStyle = arcGrad2;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.shadowColor = '#34d399';
      ctx.shadowBlur = 14;
      ctx.stroke();

      // Arrow head 2
      const a2EndAngle = Math.PI * 2.95;
      const a2x = Math.cos(a2EndAngle) * 120;
      const a2y = Math.sin(a2EndAngle) * 120;
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(a2x - 8, a2y + 2);
      ctx.lineTo(a2x + 6, a2y + 9);
      ctx.lineTo(a2x + 2, a2y - 8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // 4. Central Large Translucent Stylized Rupee Monogram '₹'
      ctx.save();
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 28;

      const diskGrad = ctx.createLinearGradient(cx - 60, cy - 70, cx + 60, cy + 70);
      diskGrad.addColorStop(0, 'rgba(8, 145, 178, 0.7)');
      diskGrad.addColorStop(0.5, 'rgba(15, 118, 110, 0.85)');
      diskGrad.addColorStop(1, 'rgba(7, 18, 28, 0.95)');

      ctx.fillStyle = diskGrad;
      ctx.beginPath();
      ctx.roundRect(cx - 55, cy - 65, 110, 130, 24);
      ctx.fill();

      // Glowing Rim Border
      ctx.strokeStyle = 'rgba(103, 232, 249, 0.8)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Monogram Text ₹
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 78px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 10;
      ctx.fillText('₹', cx, cy + 4);
      ctx.restore();

      // 5. Orbiting Financial Badges (UPI, XIRR)
      const upiAngle = t * 0.9;
      const upiX = cx + Math.cos(upiAngle) * 95;
      const upiY = cy + Math.sin(upiAngle) * 95;

      ctx.save();
      ctx.fillStyle = '#10b981';
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(upiX, upiY, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('₹', upiX, upiY + 1);
      ctx.restore();

      const secAngle = t * 0.9 + Math.PI;
      const secX = cx + Math.cos(secAngle) * 95;
      const secY = cy + Math.sin(secAngle) * 95;

      ctx.save();
      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(secX, secY, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '800 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('GST', secX, secY + 1);
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isVisible, size]);

  return (
    <div
      className={`l-brand-monogram-container ${className}`}
      style={{ position: 'relative', width: `${size}px`, height: `${size}px`, maxWidth: '100%', marginBottom: '1.5rem', ...style }}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
};
