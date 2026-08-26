import React, { useEffect, useRef } from 'react';

export interface HeroPlanetCanvasProps {
  isVisible?: boolean;
  mouseTargetX?: number;
  mouseTargetY?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const HeroPlanetCanvas: React.FC<HeroPlanetCanvasProps> = ({
  isVisible = true,
  mouseTargetX = 0,
  mouseTargetY = 0,
  className = '',
  style = {}
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mousePosRef = useRef({ targetX: mouseTargetX, targetY: mouseTargetY });

  useEffect(() => {
    mousePosRef.current = { targetX: mouseTargetX, targetY: mouseTargetY };
  }, [mouseTargetX, mouseTargetY]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = Math.min(1080, window.innerWidth - 32) * 2);
    let height = (canvas.height = 560 * 2);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(2, 2);

    const handleResize = () => {
      if (!canvasRef.current) return;
      width = canvasRef.current.width = Math.min(1080, window.innerWidth - 32) * 2;
      height = canvasRef.current.height = 560 * 2;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(2, 2);
    };
    window.addEventListener('resize', handleResize);

    const totalPoints = 550;
    const points: { x: number; y: number; z: number; isLand: boolean; sizeMult: number; baseAlpha: number }[] = [];
    const radius = 135;

    for (let i = 0; i < totalPoints; i++) {
      const theta = Math.acos(1 - (2 * (i + 0.5)) / totalPoints);
      const phi = Math.PI * (1 + Math.sqrt(5)) * i;

      const x = radius * Math.sin(theta) * Math.cos(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(theta);

      const lat = Math.asin(y / radius);
      const lon = Math.atan2(z, x);

      const continentNoise =
        Math.sin(lat * 3.5 + lon * 2.2) * Math.cos(lat * 2.8 - lon * 3.2) +
        Math.sin(lat * 6.5 + lon * 4.5) * 0.35;
      const isLand = continentNoise > -0.05;

      points.push({
        x,
        y,
        z,
        isLand,
        sizeMult: isLand ? 1.35 : 0.85,
        baseAlpha: isLand ? 0.95 : 0.4
      });
    }

    let rotationY = 0;
    let rotationX = 0.22;

    const render = () => {
      if (!isVisible) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width / 2, height / 2);
      const centerX = width / 4;
      const centerY = height / 4;

      rotationY += 0.0035;
      const targetTiltY = mousePosRef.current.targetX * 0.18;
      const targetTiltX = 0.22 + mousePosRef.current.targetY * 0.12;
      rotationX += (targetTiltX - rotationX) * 0.05;

      // 1. Ambient Horizon Core Glow
      const coreGlow = ctx.createRadialGradient(centerX, centerY, radius * 0.2, centerX, centerY, radius * 1.5);
      coreGlow.addColorStop(0, 'rgba(6, 182, 212, 0.22)');
      coreGlow.addColorStop(0.4, 'rgba(20, 184, 166, 0.09)');
      coreGlow.addColorStop(0.8, 'rgba(16, 185, 129, 0.02)');
      coreGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = coreGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // 2. Background Orbital Streamer Arc (Z < 0)
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(-0.35);

      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 1.38, radius * 0.44, 0, Math.PI, Math.PI * 2);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.18)';
      ctx.lineWidth = 1.4;
      ctx.setLineDash([4, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.restore();

      // 3. Project 3D Points
      const currentRotY = rotationY + mousePosRef.current.targetX * 0.18;
      const cosY = Math.cos(currentRotY);
      const sinY = Math.sin(currentRotY);
      const cosX = Math.cos(rotationX);
      const sinX = Math.sin(rotationX);

      const projected = points.map((p) => {
        const x1 = p.x * cosY + p.z * sinY;
        const z1 = -p.x * sinY + p.z * cosY;

        const y2 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX;

        const fov = 450;
        const scale = fov / (fov + z2);
        const screenX = centerX + x1 * scale;
        const screenY = centerY + y2 * scale;

        const frontFacing = z2 > 0;
        const topElevation = Math.max(0, (y2 + radius) / (radius * 2));
        const intensity = (z2 + radius) / (radius * 2);

        return {
          screenX,
          screenY,
          scale,
          z: z2,
          isLand: p.isLand,
          sizeMult: p.sizeMult,
          alpha: Math.min(1, Math.max(0.06, intensity * p.baseAlpha + topElevation * 0.35)),
          isBright: frontFacing && (p.isLand || topElevation > 0.3)
        };
      });

      projected.sort((a, b) => a.z - b.z);

      for (const p of projected) {
        if (p.z > -radius * 0.94) {
          ctx.beginPath();
          const dotSize = Math.max(0.75, p.scale * 1.65 * p.sizeMult);
          ctx.arc(p.screenX, p.screenY, dotSize, 0, Math.PI * 2);

          if (p.z > radius * 0.25 && p.isBright) {
            ctx.fillStyle = `rgba(207, 250, 254, ${p.alpha * 1.2})`;
            ctx.shadowColor = 'rgba(6, 182, 212, 0.75)';
            ctx.shadowBlur = 4;
          } else if (p.z > 0) {
            ctx.fillStyle = `rgba(103, 232, 249, ${p.alpha * 0.92})`;
            ctx.shadowBlur = 0;
          } else {
            ctx.fillStyle = `rgba(148, 163, 184, ${p.alpha * 0.38})`;
            ctx.shadowBlur = 0;
          }
          ctx.fill();
        }
      }
      ctx.shadowBlur = 0;

      // 4. Foreground Orbital Streamer Ring (Z > 0) with Traveling Photon Beam
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(-0.35);

      ctx.beginPath();
      ctx.ellipse(0, 0, radius * 1.38, radius * 0.44, 0, 0, Math.PI);
      ctx.strokeStyle = 'rgba(103, 232, 249, 0.55)';
      ctx.lineWidth = 1.6;
      ctx.stroke();

      const pulseT = (Date.now() * 0.0018) % (Math.PI * 2);
      const pulseX = Math.cos(pulseT) * radius * 1.38;
      const pulseY = Math.sin(pulseT) * radius * 0.44;
      const isForegroundPhoton = Math.sin(pulseT) >= 0;
      const photonGlowRadius = isForegroundPhoton ? 26 : 10;

      const photonGrad = ctx.createRadialGradient(pulseX, pulseY, 0, pulseX, pulseY, photonGlowRadius);
      photonGrad.addColorStop(0, '#ffffff');
      photonGrad.addColorStop(0.3, isForegroundPhoton ? 'rgba(103, 232, 249, 0.95)' : 'rgba(6, 182, 212, 0.4)');
      photonGrad.addColorStop(0.7, isForegroundPhoton ? 'rgba(16, 185, 129, 0.4)' : 'rgba(20, 184, 166, 0.1)');
      photonGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = photonGrad;
      ctx.beginPath();
      ctx.arc(pulseX, pulseY, photonGlowRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(pulseX, pulseY, isForegroundPhoton ? 3.5 : 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isVisible]);

  return (
    <canvas
      ref={canvasRef}
      className={`l-planet-canvas ${className}`}
      style={{
        width: '100%',
        maxWidth: '1040px',
        height: 'auto',
        display: 'block',
        margin: '0 auto',
        filter: 'drop-shadow(0 30px 70px rgba(0,0,0,0.95))',
        ...style
      }}
    />
  );
};
