'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchPostHistory, togglePostFavorite } from '@/lib/actions';

interface Post {
  id: string;
  platform: string;
  post_type: string;
  tone: string;
  variant_type: string;
  content: string;
  hashtags: string[];
  user_rating?: number;
  was_used: boolean;
  is_favorite: boolean;
  generated_at: string;
}

export default function HistoryPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'favorites' | 'used'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    const result = await fetchPostHistory(50);
    if (result.success) {
      setPosts(result.posts as Post[]);
    }
    setLoading(false);
  };

  const handleCopy = async (post: Post) => {
    const fullContent = `${post.content}\n\n${post.hashtags?.join(' ') || ''}`;
    await navigator.clipboard.writeText(fullContent);
    setCopiedId(post.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggleFavorite = async (postId: string, current: boolean) => {
    await togglePostFavorite(postId, !current);
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, is_favorite: !current } : p
    ));
  };

  const filteredPosts = posts.filter(post => {
    if (filter === 'favorites') return post.is_favorite;
    if (filter === 'used') return post.was_used;
    return true;
  });

  const platformEmoji: Record<string, string> = {
    facebook: '📘',
    instagram: '📸',
    tiktok: '🎵',
  };

  const variantColors: Record<string, string> = {
    safe: '#10b981',
    creative: '#8b5cf6',
    emotional: '#ef4444',
  };

  return (
    <div className="history-page">
      <header className="history-header">
        <Link href="/dashboard" className="back-link">
          ← Înapoi la Dashboard
        </Link>
        <h1>📚 Istoric Postări</h1>
        <p className="subtitle">Toate postările generate de AI Brain</p>
      </header>

      {/* Filters */}
      <div className="filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Toate ({posts.length})
        </button>
        <button
          className={`filter-btn ${filter === 'favorites' ? 'active' : ''}`}
          onClick={() => setFilter('favorites')}
        >
          ⭐ Favorite ({posts.filter(p => p.is_favorite).length})
        </button>
        <button
          className={`filter-btn ${filter === 'used' ? 'active' : ''}`}
          onClick={() => setFilter('used')}
        >
          ✓ Folosite ({posts.filter(p => p.was_used).length})
        </button>
      </div>

      {/* Posts Grid */}
      {loading ? (
        <div className="loading">Se încarcă...</div>
      ) : filteredPosts.length === 0 ? (
        <div className="empty">
          <p>Nu sunt postări încă.</p>
          <a href="/dashboard" className="cta-link">→ Generează prima postare</a>
        </div>
      ) : (
        <div className="posts-grid">
          {filteredPosts.map((post) => (
            <div key={post.id} className="post-card">
              {/* Header */}
              <div className="post-header">
                <span className="post-platform">
                  {platformEmoji[post.platform] || '📝'} {post.platform}
                </span>
                <span
                  className="post-variant"
                  style={{ background: variantColors[post.variant_type] || '#6b7280' }}
                >
                  {post.variant_type}
                </span>
              </div>

              {/* Content */}
              <div className="post-content">
                {post.content.slice(0, 200)}
                {post.content.length > 200 && '...'}
              </div>

              {/* Meta */}
              <div className="post-meta">
                <span className="post-date">
                  {new Date(post.generated_at).toLocaleDateString('ro-RO', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                {post.user_rating && (
                  <span className="post-rating">
                    {'★'.repeat(post.user_rating)}{'☆'.repeat(5 - post.user_rating)}
                  </span>
                )}
              </div>

              {/* Badges */}
              <div className="post-badges">
                {post.was_used && <span className="badge used">✓ Folosit</span>}
                {post.is_favorite && <span className="badge favorite">⭐ Favorit</span>}
              </div>

              {/* Actions */}
              <div className="post-actions">
                <button
                  className="action-btn"
                  onClick={() => handleCopy(post)}
                >
                  {copiedId === post.id ? '✓' : '📋'}
                </button>
                <button
                  className={`action-btn ${post.is_favorite ? 'active' : ''}`}
                  onClick={() => handleToggleFavorite(post.id, post.is_favorite)}
                >
                  {post.is_favorite ? '⭐' : '☆'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .history-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .history-header {
          text-align: center;
          margin-bottom: 2rem;
          position: relative;
        }

        .back-link {
          position: absolute;
          left: 0;
          top: 0;
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          color: #667eea;
          text-decoration: none;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .back-link:hover {
          background: #667eea;
          border-color: #667eea;
          color: white;
        }

        .history-header h1 {
          font-size: 2rem;
          color: #1a1a2e;
          margin-bottom: 0.5rem;
        }

        .subtitle {
          color: #6b7280;
        }

        .filters {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .filter-btn {
          padding: 0.75rem 1.5rem;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 9999px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .filter-btn:hover {
          border-color: #667eea;
        }

        .filter-btn.active {
          background: #667eea;
          border-color: #667eea;
          color: white;
        }

        .loading, .empty {
          text-align: center;
          padding: 4rem;
          color: #6b7280;
        }

        .cta-link {
          display: inline-block;
          margin-top: 1rem;
          color: #667eea;
          text-decoration: none;
          font-weight: 500;
        }

        .posts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }

        .post-card {
          background: white;
          border-radius: 16px;
          padding: 1.25rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.2s ease;
        }

        .post-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transform: translateY(-2px);
        }

        .post-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .post-platform {
          font-weight: 500;
          color: #374151;
        }

        .post-variant {
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          color: white;
          font-weight: 500;
        }

        .post-content {
          color: #4b5563;
          line-height: 1.5;
          margin-bottom: 0.75rem;
          font-size: 0.9rem;
        }

        .post-meta {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: #9ca3af;
          margin-bottom: 0.75rem;
        }

        .post-rating {
          color: #fbbf24;
        }

        .post-badges {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }

        .badge {
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.625rem;
          font-weight: 500;
        }

        .badge.used {
          background: #d1fae5;
          color: #065f46;
        }

        .badge.favorite {
          background: #fef3c7;
          color: #92400e;
        }

        .post-actions {
          display: flex;
          gap: 0.5rem;
        }

        .action-btn {
          padding: 0.5rem 0.75rem;
          background: #f3f4f6;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .action-btn:hover {
          background: #e5e7eb;
        }

        .action-btn.active {
          background: #fef3c7;
        }
      `}</style>
    </div>
  );
}
