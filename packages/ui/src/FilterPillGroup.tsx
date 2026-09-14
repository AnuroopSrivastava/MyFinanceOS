import React, { useRef } from 'react';

export interface FilterPillOption<T extends string = string> {
  id: T;
  label: string;
  count?: number;
}

export interface FilterPillGroupProps<T extends string = string> {
  options: (FilterPillOption<T> | T)[];
  selected: T;
  onChange: (value: T) => void;
  ariaLabel?: string;
  className?: string;
  pillClassName?: string;
}

export const FilterPillGroup = <T extends string = string>({
  options,
  selected,
  onChange,
  ariaLabel = 'Filter options',
  className = '',
  pillClassName = 'filter-pill changelog-filter-pill'
}: FilterPillGroupProps<T>): React.ReactElement => {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (index + 1) % options.length;
      const nextOpt = options[nextIndex];
      const nextId = (typeof nextOpt === 'string' ? nextOpt : nextOpt.id) as T;
      onChange(nextId);
      buttonRefs.current[nextIndex]?.focus();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (index - 1 + options.length) % options.length;
      const prevOpt = options[prevIndex];
      const prevId = (typeof prevOpt === 'string' ? prevOpt : prevOpt.id) as T;
      onChange(prevId);
      buttonRefs.current[prevIndex]?.focus();
    }
  };

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={`filter-pill-group ${className}`.trim()}
      style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}
    >
      {options.map((opt, idx) => {
        const id = (typeof opt === 'string' ? opt : opt.id) as T;
        const label = typeof opt === 'string' ? opt : opt.label;
        const count = typeof opt === 'string' ? undefined : opt.count;
        const isSelected = selected === id;

        return (
          <button
            key={id}
            ref={(el) => {
              buttonRefs.current[idx] = el;
            }}
            type="button"
            className={`${pillClassName} ${isSelected ? 'active is-active' : ''}`.trim()}
            aria-pressed={isSelected}
            onClick={() => onChange(id)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
          >
            <span>{label}</span>
            {count !== undefined && (
              <span className="filter-pill-count changelog-tabular" style={{ fontVariantNumeric: 'tabular-nums', marginLeft: '4px' }}>
                ({count})
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default FilterPillGroup;
