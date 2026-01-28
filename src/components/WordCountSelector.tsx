'use client';

export type WordCount = 'short' | 'medium' | 'long';

interface WordCountSelectorProps {
    selected: WordCount;
    onChange: (value: WordCount) => void;
}

const OPTIONS: { value: WordCount; label: string; hint: string; icon: string }[] = [
    { value: 'short', label: 'Scurt', hint: '< 30 cuvinte', icon: '📝' },
    { value: 'medium', label: 'Mediu', hint: '30 - 70 cuvinte', icon: '📄' },
    { value: 'long', label: 'Lung', hint: '> 100 cuvinte', icon: '📋' },
];

export function WordCountSelector({ selected, onChange }: WordCountSelectorProps) {
    return (
        <div className="word-count-selector">
            {OPTIONS.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    className={`word-count-option ${selected === option.value ? 'active' : ''}`}
                    onClick={() => onChange(option.value)}
                >
                    <span className="option-icon">{option.icon}</span>
                    <div className="option-content">
                        <span className="option-label">{option.label}</span>
                        <span className="option-hint">{option.hint}</span>
                    </div>
                </button>
            ))}

            <style jsx>{`
        .word-count-selector {
          display: flex;
          gap: 0.75rem;
        }

        .word-count-option {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.875rem 1rem;
          background: white;
          border: 2px solid rgba(102, 126, 234, 0.15);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
        }

        .word-count-option:hover {
          border-color: rgba(102, 126, 234, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.1);
        }

        .word-count-option.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-color: transparent;
          color: white;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }

        .option-icon {
          font-size: 1.5rem;
        }

        .option-content {
          display: flex;
          flex-direction: column;
        }

        .option-label {
          font-weight: 600;
          font-size: 0.95rem;
        }

        .option-hint {
          font-size: 0.75rem;
          opacity: 0.7;
        }

        .word-count-option.active .option-hint {
          opacity: 0.9;
        }

        @media (max-width: 600px) {
          .word-count-selector {
            flex-direction: column;
          }
        }
      `}</style>
        </div>
    );
}
