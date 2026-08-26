import React from 'react';
import Link from 'next/link';

export interface LandingFooterProps {
  className?: string;
  style?: React.CSSProperties;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({
  className = '',
  style = {}
}) => {
  return (
    <footer className={`l-footer ${className}`} style={style}>
      <div className="l-footer-inner">
        {/* Brand & Mission Column */}
        <div className="l-footer-brand-col">
          <div className="l-footer-logo">
            <span className="l-footer-logo-glyph">₹</span>
            <span className="l-footer-logo-text">
              MyFinance<span>OS</span>
            </span>
          </div>
          <p className="l-footer-desc">
            The private personal and business finance app built for India. Real-time tax optimization, multi-account ledgers, and end-to-end encrypted cloud sync.
          </p>
          <div className="l-footer-status">
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981',
                display: 'inline-block',
                boxShadow: '0 0 8px #10b981'
              }}
            />
            <span>100% Client-Side AES-256-GCM Encrypted</span>
          </div>
        </div>

        {/* Navigation Links Grid */}
        <div className="l-footer-links-grid">
          <div className="l-footer-col">
            <h4>Product</h4>
            <a href="#products-showcase">Interactive Sandboxes</a>
            <a href="#value-narrative">Architecture Pillars</a>
            <a href="#all-features">OS Capabilities</a>
            <a href="#metrics-telemetry">Telemetry in Numbers</a>
          </div>

          <div className="l-footer-col">
            <h4>Resources</h4>
            <a href="#faq-section" className="l-footer-link">Knowledge Base & FAQ</a>
            <a href="#feedback-section" className="l-footer-link">Direct Feedback</a>
            <Link href="/privacy#architecture" className="l-footer-link">
              Security Architecture
            </Link>
          </div>

          <div className="l-footer-col">
            <h4>Legal & Privacy</h4>
            <Link href="/privacy" className="l-footer-link">
              Privacy Policy
            </Link>
            <Link href="/terms" className="l-footer-link">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="l-footer-bottom">
        <div className="l-footer-bottom-inner">
          <p className="l-footer-copy">
            © {new Date().getFullYear()} MyFinanceOS. All rights reserved. Zero-Knowledge Financial Architecture.
          </p>
          <div className="l-footer-tag">
            <span>🇮🇳 Built for India's Financial Sovereignty</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
