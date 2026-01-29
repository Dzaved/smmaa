'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchPostHistory, togglePostFavorite } from '@/lib/actions';
import { Sparkles, Calendar, History, Settings, ArrowLeft, Copy, Check, Star, Filter, Search } from 'lucide-react';

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
    safe: 'bg-emerald-500/10 text-emerald-600',
    creative: 'bg-violet-500/10 text-violet-600',
    emotional: 'bg-rose-500/10 text-rose-600',
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Sparkles className="h-5 w-5" />
            </div>
            <span className="font-heading text-lg font-bold">SocialFlow</span>
          </div>
          <span className="hidden text-sm text-muted-foreground sm:block">AI-Powered Content Generator</span>
        </div>
      </header>

      {/* Navigation Tabs - Mobile Optimized */}
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center gap-1 overflow-x-auto rounded-xl bg-secondary p-1 scrollbar-hide">
          <Link
            href="/dashboard"
            className="flex min-w-fit items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <Sparkles className="h-4 w-4" />
            Generate
          </Link>
          <Link
            href="/calendar"
            className="flex min-w-fit items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <Calendar className="h-4 w-4" />
            Calendar
          </Link>
          <Link
            href="/history"
            className="flex min-w-fit items-center gap-2 rounded-lg bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-sm"
          >
            <History className="h-4 w-4" />
            History
          </Link>
          <Link
            href="/settings"
            className="flex min-w-fit items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
            Settings
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-12">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Post History</h1>
            <p className="text-muted-foreground">Manage and review your AI-generated content</p>
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <button
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${filter === 'all'
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              onClick={() => setFilter('all')}
            >
              <Filter className="h-3.5 w-3.5" />
              All Posts
            </button>
            <button
              className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${filter === 'favorites'
                ? 'border-amber-500 bg-amber-500 text-white'
                : 'border-border bg-card text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              onClick={() => setFilter('favorites')}
            >
              <Star className="h-3.5 w-3.5" />
              Favorites
            </button>
          </div>
        </div>

        {/* Posts Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
              <History className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No posts found</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              {filter === 'all'
                ? "You haven't generated any posts yet. Go to the dashboard to create your first post!"
                : "No posts match the selected filter."}
            </p>
            {filter === 'all' && (
              <Link
                href="/dashboard"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                <Sparkles className="h-4 w-4" />
                Generate First Post
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => (
              <div key={post.id} className="group flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md">
                <div>
                  {/* Header */}
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl" role="img" aria-label={post.platform}>
                        {platformEmoji[post.platform] || '📝'}
                      </span>
                      <span className="text-sm font-medium capitalize text-foreground">
                        {post.platform}
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${variantColors[post.variant_type] || 'bg-secondary text-muted-foreground'
                        }`}
                    >
                      {post.variant_type}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="mb-4">
                    <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground">
                      {post.content}
                    </p>
                  </div>

                  {/* Badges */}
                  <div className="mb-4 flex flex-wrap gap-2">
                    {post.was_used && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <Check className="h-3 w-3" /> Used
                      </span>
                    )}
                    {post.is_favorite && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        <Star className="h-3 w-3" /> Favorite
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div>
                  <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {new Date(post.generated_at).toLocaleDateString()}
                    </span>
                    {post.user_rating && (
                      <span className="flex text-amber-500">
                        {'★'.repeat(post.user_rating)}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 border-t border-border pt-3">
                    <button
                      onClick={() => handleCopy(post)}
                      className="flex items-center justify-center gap-2 rounded-lg bg-secondary py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80"
                    >
                      {copiedId === post.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copiedId === post.id ? 'Copied' : 'Copy'}
                    </button>
                    <button
                      onClick={() => handleToggleFavorite(post.id, post.is_favorite)}
                      className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors ${post.is_favorite
                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-secondary text-foreground hover:bg-secondary/80'
                        }`}
                    >
                      <Star className={`h-4 w-4 ${post.is_favorite ? 'fill-current' : ''}`} />
                      {post.is_favorite ? 'Saved' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
