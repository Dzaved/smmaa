'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchPostHistory, togglePostFavorite, schedulePost } from '@/lib/actions';
import { Sparkles, Calendar, History, Copy, Check, Star, Filter, Clock } from 'lucide-react';
import Navigation from '@/components/Navigation';

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
  scheduled_for?: string;
  media_url?: string;
}

export default function HistoryPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'favorites' | 'used'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Scheduling & Modal State
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [schedulingPostId, setSchedulingPostId] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [copied, setCopied] = useState(false); // For modal

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

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

  const handleModalCopy = async (content: string, hashtags: string[]) => {
    const fullContent = `${content}\n\n${hashtags.join(' ')}`;
    await navigator.clipboard.writeText(fullContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleFavorite = async (postId: string, current: boolean) => {
    await togglePostFavorite(postId, !current);
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, is_favorite: !current } : p
    ));
  };

  const handleSchedule = async (postId: string) => {
    if (!scheduleDate) return;

    // Optimistic update
    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, scheduled_for: scheduleDate } : p // Using scheduled_for to match DB/Interface
    ));
    setSchedulingPostId(null);
    setScheduleDate('');

    try {
      const response = await schedulePost(postId, scheduleDate);
      if (!response.success) {
        // Revert on failure
        setPosts(prev => prev.map(p =>
          p.id === postId ? { ...p, scheduled_for: undefined } : p
        ));
        setNotification({ type: 'error', message: `Failed to schedule post: ${response.error}` });
      } else {
        setNotification({ type: 'success', message: 'Post scheduled successfully!' });
      }
    } catch (e) {
      console.error(e);
      setNotification({ type: 'error', message: 'Error scheduling post: ' + (e instanceof Error ? e.message : String(e)) });
    }
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

  const platformColors: Record<string, string> = {
    facebook: 'bg-[#1877F2]',
    instagram: 'bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737]',
    tiktok: 'bg-black',
  };

  const variantColors: Record<string, string> = {
    safe: 'bg-emerald-500/10 text-emerald-600',
    creative: 'bg-violet-500/10 text-violet-600',
    emotional: 'bg-rose-500/10 text-rose-600',
  };

  return (
    <div className="min-h-screen bg-background relative">
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
      <Navigation />

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-24 md:pb-12">
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
              <div key={post.id} className="group flex flex-col justify-between rounded-xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md cursor-pointer" onClick={() => setSelectedPost(post)}>
                <div>
                  {/* Header */}
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {/* Status Indicator */}
                      {post.scheduled_for ? (
                        <span className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary" title="Scheduled">
                          <Calendar className="h-4 w-4" />
                        </span>
                      ) : (
                        <span className="text-xl" role="img" aria-label={post.platform}>
                          {platformEmoji[post.platform] || '📝'}
                        </span>
                      )}
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

                  {/* Scheduling Form (Inline) - Prevents opening modal */}
                  {schedulingPostId === post.id && (
                    <div className="mb-4 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3" onClick={(e) => e.stopPropagation()}>
                      <Calendar className="h-4 w-4 text-primary" />
                      <input
                        type="date"
                        className="flex-1 rounded-md border border-border bg-background px-3 py-1 text-sm"
                        value={scheduleDate}
                        onChange={(e) => setScheduleDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                      />
                      <button
                        onClick={() => handleSchedule(post.id)}
                        disabled={!scheduleDate}
                        className="rounded-md bg-primary px-3 py-1 text-sm font-medium text-primary-foreground disabled:opacity-50"
                      >
                        Confirm
                      </button>
                    </div>
                  )}

                  {/* Content Preview */}
                  <div className="mb-4">
                    <p className="line-clamp-4 text-sm leading-relaxed text-muted-foreground">
                      {post.content}
                    </p>
                  </div>

                  {/* Badges */}
                  <div className="mb-4 flex flex-wrap gap-2">
                    {post.scheduled_for && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                        <Calendar className="h-3 w-3" /> Scheduled: {new Date(post.scheduled_for).toLocaleDateString()}
                      </span>
                    )}
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
                <div onClick={(e) => e.stopPropagation()}>
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

                  <div className="grid grid-cols-3 gap-2 border-t border-border pt-3">
                    <button
                      className={`flex items-center justify-center gap-1 rounded-lg border py-2 text-xs font-medium transition-colors ${schedulingPostId === post.id
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-secondary hover:bg-border'
                        }`}
                      onClick={() => {
                        if (schedulingPostId === post.id) {
                          setSchedulingPostId(null);
                        } else {
                          setSchedulingPostId(post.id);
                          setScheduleDate('');
                        }
                      }}
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      {post.scheduled_for ? 'Reschedule' : 'Schedule'}
                    </button>
                    <button
                      onClick={() => handleCopy(post)}
                      className="flex items-center justify-center gap-1 rounded-lg bg-secondary py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary/80"
                    >
                      {copiedId === post.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                      {copiedId === post.id ? 'Copied' : 'Copy'}
                    </button>
                    <button
                      onClick={() => handleToggleFavorite(post.id, post.is_favorite)}
                      className={`flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-medium transition-colors ${post.is_favorite
                        ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400'
                        : 'bg-secondary text-foreground hover:bg-secondary/80'
                        }`}
                    >
                      <Star className={`h-3.5 w-3.5 ${post.is_favorite ? 'fill-current' : ''}`} />
                      {post.is_favorite ? 'Saved' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Post Details Modal */}
      {selectedPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm" onClick={() => setSelectedPost(null)}>
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-card shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            {selectedPost.media_url && (
              <div className="relative h-64 w-full bg-black/5">
                <img
                  src={selectedPost.media_url}
                  alt="Post media"
                  className="h-full w-full object-contain"
                />
              </div>
            )}

            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-md text-white ${platformColors[selectedPost.platform.toLowerCase()] || 'bg-gray-500'}`}>
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <span className="font-semibold capitalize">{selectedPost.platform}</span>
                </div>
                <button onClick={() => setSelectedPost(null)} className="rounded-full p-1 hover:bg-secondary">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              <div className="mb-4 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Status: </span>
                {selectedPost.scheduled_for
                  ? <span className="text-primary font-medium">Scheduled for {new Date(selectedPost.scheduled_for).toLocaleDateString()}</span>
                  : 'Generated on ' + new Date(selectedPost.generated_at).toLocaleDateString()}
              </div>

              <div className="rounded-lg bg-secondary/50 p-4 mb-4 font-mono text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">
                {selectedPost.content}
              </div>

              <div className="flex flex-wrap gap-2 text-sm text-primary">
                {selectedPost.hashtags?.map(tag => (
                  <span key={tag}>{tag.startsWith('#') ? tag : '#' + tag}</span>
                ))}
              </div>

              <div className="mt-6 flex justify-between gap-3">
                <button
                  onClick={() => handleModalCopy(selectedPost.content, selectedPost.hashtags)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2 text-sm font-medium transition-colors hover:bg-border"
                >
                  {copied ? 'Copied' : 'Copy Content'}
                </button>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 pointer-events-none">
          <div className="animate-in fade-in zoom-in-95 duration-200 pointer-events-auto flex items-center gap-3 rounded-xl border bg-card/95 p-4 shadow-xl backdrop-blur-md dark:bg-card/80 dark:border-border">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${notification.type === 'success' ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'
              }`}>
              {notification.type === 'success' ? (
                <Check className="h-5 w-5" />
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              )}
            </div>
            <div>
              <h4 className="font-semibold text-sm">
                {notification.type === 'success' ? 'Success' : 'Error'}
              </h4>
              <p className="text-sm text-muted-foreground">{notification.message}</p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="ml-2 rounded-full p-1 text-muted-foreground hover:bg-secondary"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
