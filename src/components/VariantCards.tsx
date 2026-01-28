'use client';

import { useState } from 'react';
import type { GeneratedPost, VariantType } from '@/lib/brain';

interface VariantCardsProps {
  posts: GeneratedPost[];
  onCopy: (content: string) => void;
  onRate: (postId: string, rating: number) => void;
  onFavorite: (postId: string, isFavorite: boolean) => void;
  onMarkUsed: (postId: string) => void;
}

const VARIANT_STYLES: Record<VariantType, { label: string; color: string; icon: string; description: string }> = {
  safe: {
    label: 'Sigur',
    color: '#10b981',
    icon: '🛡️',
    description: 'Conservator, proven, risc minim',
  },
  creative: {
    label: 'Creativ',
    color: '#8b5cf6',
    icon: '✨',
    description: 'Inovator, surprinzător, fresh',
  },
  emotional: {
    label: 'Emoțional',
    color: '#ef4444',
    icon: '❤️',
    description: 'Din inimă, povești, conectare',
  },
};

export function VariantCards({ posts, onCopy, onRate, onFavorite, onMarkUsed }: VariantCardsProps) {
  const [activeTab, setActiveTab] = useState<VariantType>('emotional');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [usedIds, setUsedIds] = useState<Set<string>>(new Set());

  const handleCopy = async (post: GeneratedPost) => {
    const fullContent = `${post.variant.content}\n\n${post.hashtags.join(' ')}`;
    await navigator.clipboard.writeText(fullContent);
    setCopiedId(post.variant.type);
    onCopy(fullContent);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRate = (postId: string, rating: number) => {
    if (!postId) return;
    setRatings(prev => ({ ...prev, [postId]: rating }));
    onRate(postId, rating);
  };

  const handleFavorite = (post: GeneratedPost) => {
    if (!post.id) {
      alert('Postarea nu a fost salvată încă. Așteaptă câteva secunde și încearcă din nou.');
      return;
    }
    onFavorite(post.id, true);
    setSavedIds(prev => new Set([...prev, post.id!]));
  };

  const handleMarkUsed = (post: GeneratedPost) => {
    if (!post.id) {
      alert('Postarea nu a fost salvată încă. Așteaptă câteva secunde și încearcă din nou.');
      return;
    }
    onMarkUsed(post.id);
    setUsedIds(prev => new Set([...prev, post.id!]));
  };

  const activePost = posts.find(p => p.variant.type === activeTab) || posts[0];

  return (
    <div className="variant-cards-container">
      {/* Tab Selector */}
      <div className="variant-tabs">
        {posts.map((post) => {
          const style = VARIANT_STYLES[post.variant.type];
          const isActive = activeTab === post.variant.type;

          return (
            <button
              key={post.variant.type}
              className={`variant-tab ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(post.variant.type)}
              style={{ '--accent-color': style.color } as React.CSSProperties}
            >
              <span className="tab-icon">{style.icon}</span>
              <span className="tab-label">{style.label}</span>
              <span className="tab-score">{post.engagementScore}%</span>
            </button>
          );
        })}
      </div>

      {/* Active Card */}
      {activePost && (
        <div
          className="variant-card"
          style={{ '--accent-color': VARIANT_STYLES[activePost.variant.type].color } as React.CSSProperties}
        >
          {/* Header */}
          <div className="card-header">
            <div className="card-type">
              <span className="type-icon">{VARIANT_STYLES[activePost.variant.type].icon}</span>
              <div>
                <h3 className="type-label">{VARIANT_STYLES[activePost.variant.type].label}</h3>
                <p className="type-description">{VARIANT_STYLES[activePost.variant.type].description}</p>
              </div>
            </div>
            <div className="engagement-badge">
              <span className="engagement-score">{activePost.engagementScore}</span>
              <span className="engagement-label">Engagement</span>
            </div>
          </div>

          {/* Content */}
          <div className="card-content">
            <p className="content-text">{activePost.variant.content}</p>
          </div>

          {/* Hashtags */}
          <div className="card-hashtags">
            {activePost.hashtags.slice(0, 8).map((tag, i) => (
              <span key={i} className="hashtag">{tag}</span>
            ))}
            {activePost.hashtags.length > 8 && (
              <span className="hashtag-more">+{activePost.hashtags.length - 8}</span>
            )}
          </div>

          {/* Tip */}
          <div className="card-tip">
            <span className="tip-icon">💡</span>
            <span className="tip-text">{activePost.tip}</span>
          </div>

          {/* Meta */}
          <div className="card-meta">
            <div className="meta-item">
              <span className="meta-icon">⏰</span>
              <span>Postează: {activePost.bestPostingTime}</span>
            </div>
            <div className="meta-item">
              <span className="meta-icon">🖼️</span>
              <span>{activePost.visualSuggestion.slice(0, 50)}...</span>
            </div>
          </div>

          {/* Actions */}
          <div className="card-actions">
            <button
              className="action-btn copy-btn"
              onClick={() => handleCopy(activePost)}
            >
              {copiedId === activePost.variant.type ? '✓ Copiat!' : '📋 Copiază'}
            </button>
            <button
              className={`action-btn favorite-btn ${activePost.id && savedIds.has(activePost.id) ? 'saved' : ''}`}
              onClick={() => handleFavorite(activePost)}
            >
              {activePost.id && savedIds.has(activePost.id) ? '✓ Salvat!' : '⭐ Salvează'}
            </button>
            <button
              className={`action-btn use-btn ${activePost.id && usedIds.has(activePost.id) ? 'used' : ''}`}
              onClick={() => handleMarkUsed(activePost)}
            >
              {activePost.id && usedIds.has(activePost.id) ? '✓ Marcat!' : '✓ Am folosit'}
            </button>
          </div>

          {/* Rating */}
          <div className="card-rating">
            <span className="rating-label">Cât de bun e?</span>
            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className={`star-btn ${(ratings[activePost.id || ''] || 0) >= star ? 'active' : ''}`}
                  onClick={() => handleRate(activePost.id || '', star)}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .variant-cards-container {
          margin-top: 2rem;
        }

        .variant-tabs {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .variant-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .variant-tab:hover {
          border-color: var(--accent-color);
        }

        .variant-tab.active {
          background: var(--accent-color);
          border-color: var(--accent-color);
          color: white;
        }

        .tab-icon {
          font-size: 1.25rem;
        }

        .tab-label {
          font-weight: 600;
        }

        .tab-score {
          font-size: 0.75rem;
          opacity: 0.8;
        }

        .variant-card {
          background: white;
          border-radius: 16px;
          border: 2px solid var(--accent-color);
          padding: 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .card-type {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .type-icon {
          font-size: 2rem;
        }

        .type-label {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1a1a2e;
          margin: 0;
        }

        .type-description {
          font-size: 0.875rem;
          color: #6b7280;
          margin: 0;
        }

        .engagement-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: linear-gradient(135deg, var(--accent-color), color-mix(in srgb, var(--accent-color) 80%, black));
          color: white;
          padding: 0.5rem 1rem;
          border-radius: 12px;
        }

        .engagement-score {
          font-size: 1.5rem;
          font-weight: 700;
        }

        .engagement-label {
          font-size: 0.625rem;
          text-transform: uppercase;
          opacity: 0.9;
        }

        .card-content {
          background: #f9fafb;
          border-radius: 12px;
          padding: 1.25rem;
          margin-bottom: 1rem;
        }

        .content-text {
          white-space: pre-wrap;
          line-height: 1.6;
          color: #374151;
          margin: 0;
        }

        .card-hashtags {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .hashtag {
          background: #e5e7eb;
          color: #4b5563;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
        }

        .hashtag-more {
          background: var(--accent-color);
          color: white;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
        }

        .card-tip {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          background: #fef3c7;
          padding: 0.75rem 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .tip-icon {
          flex-shrink: 0;
        }

        .tip-text {
          font-size: 0.875rem;
          color: #92400e;
        }

        .card-meta {
          display: flex;
          gap: 1.5rem;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
          color: #6b7280;
        }

        .card-actions {
          display: flex;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .action-btn {
          flex: 1;
          padding: 0.75rem 1rem;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .copy-btn {
          background: var(--accent-color);
          color: white;
        }

        .copy-btn:hover {
          filter: brightness(1.1);
        }

        .favorite-btn {
          background: #fef3c7;
          color: #92400e;
        }

        .favorite-btn:hover {
          background: #fde68a;
        }

        .favorite-btn.saved {
          background: #fbbf24;
          color: white;
        }

        .use-btn {
          background: #d1fae5;
          color: #065f46;
        }

        .use-btn:hover {
          background: #a7f3d0;
        }

        .use-btn.used {
          background: #10b981;
          color: white;
        }

        .card-rating {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1rem;
        }

        .rating-label {
          font-size: 0.875rem;
          color: #6b7280;
        }

        .rating-stars {
          display: flex;
          gap: 0.25rem;
        }

        .star-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: #e5e7eb;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .star-btn:hover,
        .star-btn.active {
          color: #fbbf24;
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
}
