import React, { useState, useEffect } from 'react';
import { LandingFloatingBadge } from '../primitives/index.js';

export interface FloatingNotification {
  id: string;
  icon: string;
  iconBg: string;
  title: string;
  amount: string;
  sub: string;
  time: string;
  pos: { top?: string; bottom?: string; left?: string; right?: string };
  depth: number;
}

export const DEFAULT_HERO_NOTIFICATIONS: FloatingNotification[] = [
  {
    id: 'n1',
    icon: '₹',
    iconBg: '#10b981',
    title: 'Corporate Retainer Settled',
    amount: '+₹1,85,000.00',
    sub: 'HDFC Corporate • Auto-Reconciled',
    time: '2m ago',
    pos: { top: '22%', right: '6%' },
    depth: 44
  },
  {
    id: 'n2',
    icon: '🛡️',
    iconBg: '#06b6d4',
    title: 'Tax Optimized (Sec 115BAC)',
    amount: '₹75,000 Saved',
    sub: 'New Regime vs Old Comparator',
    time: '8m ago',
    pos: { bottom: '20%', left: '5%' },
    depth: 36
  },
  {
    id: 'n3',
    icon: '📈',
    iconBg: '#14b8a6',
    title: 'Direct MFs & Nifty 50',
    amount: '+18.4% XIRR',
    sub: '₹1.48 Cr Net Worth Milestone',
    time: '14m ago',
    pos: { bottom: '15%', right: '8%' },
    depth: 52
  },
  {
    id: 'n4',
    icon: '🔒',
    iconBg: '#f59e0b',
    title: 'Local Sovereign Vault',
    amount: 'AES-256-GCM',
    sub: 'Zero Plaintext Custody • Hardware PIN',
    time: 'Just now',
    pos: { top: '32%', left: '4%' },
    depth: 30
  }
];

export interface HeroNotificationClusterProps {
  notifications?: FloatingNotification[];
  mouseTargetX?: number;
  mouseTargetY?: number;
  autoCycleInterval?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const HeroNotificationCluster: React.FC<HeroNotificationClusterProps> = ({
  notifications = DEFAULT_HERO_NOTIFICATIONS,
  mouseTargetX = 0,
  mouseTargetY = 0,
  autoCycleInterval = 3800,
  className = '',
  style = {}
}) => {
  const [activeNotifIndex, setActiveNotifIndex] = useState(0);

  useEffect(() => {
    if (autoCycleInterval <= 0) return;
    const interval = setInterval(() => {
      setActiveNotifIndex((prev) => (prev + 1) % notifications.length);
    }, autoCycleInterval);
    return () => clearInterval(interval);
  }, [autoCycleInterval, notifications.length]);

  return (
    <div className={`l-notification-cluster ${className}`} style={style}>
      {notifications.map((n, idx) => {
        const isHighlighted = idx === activeNotifIndex;
        const parallaxX = mouseTargetX * n.depth * 0.4;
        const parallaxY = mouseTargetY * n.depth * 0.3;

        return (
          <LandingFloatingBadge
            key={n.id}
            title={n.title}
            amount={n.amount}
            sub={n.sub}
            time={n.time}
            icon={n.icon}
            iconBg={n.iconBg}
            isHighlighted={isHighlighted}
            onMouseEnter={() => setActiveNotifIndex(idx)}
            onClick={() => setActiveNotifIndex(idx)}
            style={{
              position: 'absolute',
              ...n.pos,
              transform: `translate3d(${parallaxX}px, ${parallaxY}px, ${n.depth}px) ${isHighlighted ? 'scale(1.06)' : 'scale(1)'}`,
              zIndex: isHighlighted ? 20 : 10
            }}
          />
        );
      })}
    </div>
  );
};
