import React, { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { LandingButton } from './LandingButton.js';

export interface LandingFeedbackCardProps {
  className?: string;
  style?: React.CSSProperties;
}

export const LandingFeedbackCard: React.FC<LandingFeedbackCardProps> = ({
  className = '',
  style = {}
}) => {
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [isSendingFeedback, setIsSendingFeedback] = useState(false);

  const handleFeedbackSubmit = async () => {
    if (!feedbackText.trim()) return;
    setIsSendingFeedback(true);
    setFeedbackError(null);
    try {
      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          access_key:
            process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY ||
            (typeof import.meta !== 'undefined' &&
              (import.meta as any).env?.VITE_WEB3FORMS_ACCESS_KEY) ||
            '',
          subject: 'New Feedback for MyFinanceOS',
          message: feedbackText
        })
      });
      if (response.ok) {
        setFeedbackSent(true);
        setFeedbackText('');
      } else {
        setFeedbackError('Failed to send feedback. Please check your connection and try again.');
      }
    } catch (error) {
      setFeedbackError('Unable to send feedback. Please try again later.');
    } finally {
      setIsSendingFeedback(false);
    }
  };

  return (
    <div className={`l-feedback-container ${className}`} style={style}>
      <h3
        style={{
          fontFamily: 'var(--font-display, "Plus Jakarta Sans", sans-serif)',
          fontSize: '1.35rem',
          color: '#ffffff',
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.6rem',
          fontWeight: 800
        }}
      >
        <MessageSquare size={22} color="#06b6d4" />
        Direct Feedback & Ideas
      </h3>
      <p style={{ color: 'var(--l-text-secondary, rgba(255, 255, 255, 0.8))', fontSize: '0.92rem', marginBottom: '1.5rem' }}>
        Have a question, feedback, or India-specific tax/feature suggestion?
      </p>

      {feedbackSent ? (
        <div
          style={{
            padding: '1rem',
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#34d399',
            borderRadius: '12px',
            border: '1px solid #10b981',
            fontSize: '0.9rem',
            fontWeight: 600
          }}
        >
          ✓ Thank you! Your feedback has been securely submitted.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {feedbackError && (
            <div
              style={{
                padding: '0.6rem 0.8rem',
                background: 'rgba(244, 63, 94, 0.15)',
                color: '#fda4af',
                border: '1px solid #f43f5e',
                borderRadius: '8px',
                fontSize: '0.82rem'
              }}
            >
              {feedbackError}
            </div>
          )}
          <div style={{ position: 'relative' }}>
            <textarea
              id="feedback-message"
              name="feedbackMessage"
              aria-label="How can we help you improve MyFinanceOS?"
              placeholder="How can we help you improve MyFinanceOS?"
              rows={4}
              maxLength={500}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              disabled={isSendingFeedback}
              className="l-feedback-textarea"
            />
            <div
              style={{
                textAlign: 'right',
                fontSize: '0.72rem',
                color: feedbackText.length >= 450 ? '#f59e0b' : 'var(--l-text-muted, #94a3b8)',
                marginTop: '0.25rem'
              }}
            >
              {feedbackText.length} / 500
            </div>
          </div>
          <LandingButton
            type="button"
            onClick={handleFeedbackSubmit}
            disabled={isSendingFeedback || !feedbackText.trim()}
            loading={isSendingFeedback}
            variant="primary"
            size="md"
            style={{ width: '100%' }}
          >
            Submit Feedback
          </LandingButton>
        </div>
      )}
    </div>
  );
};
