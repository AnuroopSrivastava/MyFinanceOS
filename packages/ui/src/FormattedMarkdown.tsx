import React from 'react';

export interface FormattedMarkdownProps {
  text: string;
  className?: string;
  style?: React.CSSProperties;
}

export const FormattedMarkdown: React.FC<FormattedMarkdownProps> = ({
  text,
  className = '',
  style,
}) => {
  const lines = text.split('\n');

  const renderFormattedInline = (str: string) => {
    // Split by bold syntax **
    const parts = str.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const content = part.slice(2, -2);
        return (
          <strong key={idx} style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
            {content}
          </strong>
        );
      }
      if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
        const content = part.slice(1, -1);
        return (
          <em key={idx} style={{ color: 'var(--text-secondary)' }}>
            {content}
          </em>
        );
      }
      return part;
    });
  };

  return (
    <div
      className={className}
      style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', ...style }}
    >
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={lineIdx} style={{ height: '0.2rem' }} />;

        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div
              key={lineIdx}
              style={{
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'flex-start',
                paddingLeft: '0.4rem',
              }}
            >
              <span
                style={{
                  color: 'var(--accent-1)',
                  fontSize: '0.9rem',
                  lineHeight: '1.4',
                }}
              >
                •
              </span>
              <span style={{ flex: 1 }}>{renderFormattedInline(trimmed.substring(2))}</span>
            </div>
          );
        }

        if (/^\d+\.\s/.test(trimmed)) {
          const numMatch = trimmed.match(/^(\d+\.)\s*(.*)/);
          if (numMatch) {
            return (
              <div
                key={lineIdx}
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'flex-start',
                  paddingLeft: '0.4rem',
                }}
              >
                <span
                  style={{
                    color: 'var(--accent-1)',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                  }}
                >
                  {numMatch[1]}
                </span>
                <span style={{ flex: 1 }}>{renderFormattedInline(numMatch[2])}</span>
              </div>
            );
          }
        }

        return <div key={lineIdx}>{renderFormattedInline(line)}</div>;
      })}
    </div>
  );
};
