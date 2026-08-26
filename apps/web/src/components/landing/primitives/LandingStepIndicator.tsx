import React from 'react';

export interface LandingStepIndicatorProps {
  totalSteps: number;
  activeStep: number;
  progress?: number;
  onSelectStep?: (index: number) => void;
  stepLabels?: string[];
  className?: string;
  style?: React.CSSProperties;
}

export const LandingStepIndicator: React.FC<LandingStepIndicatorProps> = ({
  totalSteps,
  activeStep,
  progress = 0,
  onSelectStep,
  stepLabels = [],
  className = '',
  style = {}
}) => {
  return (
    <div
      role="tablist"
      aria-label="Progress steps"
      className={`l-step-indicators ${className}`}
      style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', ...style }}
    >
      {Array.from({ length: totalSteps }).map((_, idx) => {
        const isCurr = idx === activeStep;
        const label = stepLabels[idx] || `Step ${idx + 1}`;

        return (
          <button
            key={idx}
            type="button"
            role="tab"
            onClick={() => onSelectStep?.(idx)}
            style={{
              flex: 1,
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              background: 'transparent',
              border: 'none',
              padding: '19px 0',
              cursor: onSelectStep ? 'pointer' : 'default',
              position: 'relative'
            }}
            aria-label={label}
            aria-selected={isCurr}
          >
            <div
              style={{
                width: '100%',
                height: '6px',
                borderRadius: '9999px',
                background: isCurr ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                overflow: 'hidden',
                position: 'relative',
                transition: 'all 0.2s ease'
              }}
            >
              {isCurr && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    width: '100%',
                    transform: `scaleX(${progress / 100})`,
                    transformOrigin: 'left',
                    background: 'linear-gradient(90deg, #06b6d4, #10b981)',
                    borderRadius: '9999px',
                    willChange: 'transform'
                  }}
                />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};
