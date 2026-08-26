import React, { useEffect, useRef } from 'react';

export interface HeroStardustCanvasProps {
  isVisible?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export const HeroStardustCanvas: React.FC<HeroStardustCanvasProps> = ({
  isVisible = true,
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
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvasRef.current) return;
      width = canvasRef.current.width = window.innerWidth;
      height = canvasRef.current.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const particles = Array.from({ length: 36 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      radius: Math.random() * 1.4 + 0.4,
      alpha: Math.random() * 0.25 + 0.05,
      color: Math.random() > 0.6 ? '#06b6d4' : Math.random() > 0.3 ? '#10b981' : '#94a3b8'
    }));

    const render = () => {
      if (!isVisible) {
        animId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      animId = requestAnimationFrame(render);
    };

    render();
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, [isVisible]);

  return (
    <canvas
      ref={canvasRef}
      className={`l-stardust-canvas ${className}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        ...style
      }}
    />
  );
};
