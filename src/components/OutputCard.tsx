'use client';

import { useState } from 'react';

interface OutputCardProps {
    title: string;
    content: string;
    hashtags?: string[];
    tip?: string;
    loading?: boolean;
}

export default function OutputCard({ title, content, hashtags, tip, loading }: OutputCardProps) {
    const [copied, setCopied] = useState<'content' | 'hashtags' | null>(null);

    const copyToClipboard = async (text: string, type: 'content' | 'hashtags') => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(type);
            setTimeout(() => setCopied(null), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    if (loading) {
        return (
            <div className="output-card animate-fade-in">
                <div className="output-header">
                    <span className="output-title">{title}</span>
                </div>
                <div className="output-content">
                    <div className="flex items-center gap-3">
                        <span className="loader"></span>
                        <span className="text-muted">Se generează conținutul...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!content) {
        return (
            <div className="output-card">
                <div className="output-header">
                    <span className="output-title">{title}</span>
                </div>
                <div className="output-content">
                    <div className="empty-state">
                        <div className="empty-state-icon">✨</div>
                        <p className="empty-state-text">
                            Selectează opțiunile și apasă „Generează" pentru a crea conținut
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="output-card animate-fade-in">
            <div className="output-header">
                <span className="output-title">{title}</span>
                <button
                    className={`copy-btn ${copied === 'content' ? 'copied' : ''}`}
                    onClick={() => copyToClipboard(content, 'content')}
                >
                    {copied === 'content' ? '✓ Copiat!' : '📋 Copiază'}
                </button>
            </div>
            <div className="output-content">{content}</div>

            {hashtags && hashtags.length > 0 && (
                <div className="output-hashtags">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Hashtag-uri:</span>
                        <button
                            className={`copy-btn ${copied === 'hashtags' ? 'copied' : ''}`}
                            onClick={() => copyToClipboard(hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' '), 'hashtags')}
                        >
                            {copied === 'hashtags' ? '✓ Copiat!' : '📋 Copiază'}
                        </button>
                    </div>
                    <div>
                        {hashtags.map((tag, i) => (
                            <span key={i} style={{ marginRight: '8px' }}>
                                {tag.startsWith('#') ? tag : `#${tag}`}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {tip && (
                <div style={{
                    padding: 'var(--space-4) var(--space-5)',
                    background: 'var(--color-warning-bg)',
                    borderTop: '1px solid var(--color-border)',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)'
                }}>
                    <strong>💡 Sfat:</strong> {tip}
                </div>
            )}
        </div>
    );
}
