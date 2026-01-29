'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchCalendarEvents, fetchPostHistory, fetchScheduledPosts } from '@/lib/actions';
import { Sparkles, Calendar as CalendarIcon, History, Settings, ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarEvent {
    id: string;
    date: string;
    name_ro: string;
    importance: number;
    tone_recommendation: string;
    content_themes: string[];
    avoid_sales: boolean;
}

interface Post {
    id: string;
    platform: string;
    variant_type: string;
    generated_at: string;
    scheduled_for?: string;
    content: string;
    hashtags: string[];
    media_url?: string;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const platformColors: Record<string, string> = {
    facebook: 'bg-[#1877F2]',
    instagram: 'bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737]',
    tiktok: 'bg-black',
};

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [scheduledPosts, setScheduledPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        loadData();
    }, [currentDate]);

    const handleCopy = async (content: string, hashtags: string[]) => {
        const fullText = `${content}\n\n${hashtags.join(' ')}`;
        await navigator.clipboard.writeText(fullText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const loadData = async () => {
        setLoading(true);
        try {
            const [eventsResult, postsResult, scheduledResult] = await Promise.all([
                fetchCalendarEvents(),
                fetchPostHistory(),
                fetchScheduledPosts()
            ]);

            if (eventsResult.success && eventsResult.events) {
                setEvents(eventsResult.events);
            }
            if (postsResult.success && postsResult.posts) {
                setPosts(postsResult.posts);
            }
            if (scheduledResult.success && scheduledResult.posts) {
                setScheduledPosts(scheduledResult.posts);
            }
        } catch (error) {
            console.error('Failed to load calendar data:', error);
        }
        setLoading(false);
    };

    const navigateMonth = (direction: number) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + direction, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const getDaysInMonth = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay();

        const prevMonthDays = [];
        const prevMonth = new Date(year, month, 0);
        for (let i = startingDay - 1; i >= 0; i--) {
            prevMonthDays.push({
                day: prevMonth.getDate() - i,
                isCurrentMonth: false,
                date: new Date(year, month - 1, prevMonth.getDate() - i)
            });
        }

        const currentMonthDays = [];
        for (let i = 1; i <= daysInMonth; i++) {
            currentMonthDays.push({
                day: i,
                isCurrentMonth: true,
                date: new Date(year, month, i)
            });
        }

        const totalCells = 42;
        const nextMonthDays = [];
        const remaining = totalCells - prevMonthDays.length - currentMonthDays.length;
        for (let i = 1; i <= remaining; i++) {
            nextMonthDays.push({
                day: i,
                isCurrentMonth: false,
                date: new Date(year, month + 1, i)
            });
        }

        return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();
    };

    const getPostsForDate = (date: Date) => {
        const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

        const scheduled = scheduledPosts.filter(p => p.scheduled_for && p.scheduled_for.startsWith(dateStr));
        const generated = posts.filter(p => p.generated_at.startsWith(dateStr) && !p.scheduled_for); // Avoid duplicates if post is in both lists (though different queries)

        return [...scheduled, ...generated];
    };

    const days = getDaysInMonth();

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
                        className="flex min-w-fit items-center gap-2 rounded-lg bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-sm"
                    >
                        <CalendarIcon className="h-4 w-4" />
                        Calendar
                    </Link>
                    <Link
                        href="/history"
                        className="flex min-w-fit items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
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
                {/* Calendar Card */}
                <div className="mb-6 rounded-2xl border border-border bg-card p-6">
                    {/* Calendar Header */}
                    <div className="mb-6 flex items-center justify-between">
                        <h2 className="text-xl font-semibold">
                            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => navigateMonth(-1)}
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card transition-colors hover:bg-secondary"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                                onClick={goToToday}
                                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                            >
                                Today
                            </button>
                            <button
                                onClick={() => navigateMonth(1)}
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card transition-colors hover:bg-secondary"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 overflow-hidden rounded-xl border border-border">
                        {/* Weekday Headers */}
                        {WEEKDAYS.map(day => (
                            <div key={day} className="border-b border-border bg-secondary py-3 text-center text-sm font-medium text-muted-foreground">
                                {day}
                            </div>
                        ))}

                        {/* Days */}
                        {loading ? (
                            <div className="col-span-7 py-12 text-center text-muted-foreground">
                                Loading...
                            </div>
                        ) : (
                            days.map((dayInfo, index) => {
                                const dayPosts = getPostsForDate(dayInfo.date);
                                const today = isToday(dayInfo.date);
                                const hasScheduled = dayPosts.some(p => p.scheduled_for);

                                return (
                                    <div
                                        key={index}
                                        className={`min-h-[80px] border-b border-r border-border p-2 transition-colors md:min-h-[100px] ${!dayInfo.isCurrentMonth ? 'bg-muted/30 text-muted-foreground' : 'bg-card hover:bg-secondary/50'
                                            } ${index % 7 === 6 ? 'border-r-0' : ''}`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <span className={`inline-flex h-7 w-7 items-center justify-center text-sm font-medium ${today ? 'rounded-full bg-primary text-primary-foreground' : ''
                                                }`}>
                                                {dayInfo.day}
                                            </span>
                                            {/* Scheduled Indicator Dot - Only if there are scheduled posts */}
                                            {hasScheduled && (
                                                <span className="h-2 w-2 rounded-full bg-primary ring-1 ring-primary-foreground" title="Has scheduled content" />
                                            )}
                                        </div>

                                        {dayPosts.length > 0 && (
                                            <div className="mt-1 flex flex-wrap gap-1">
                                                {dayPosts.slice(0, 4).map((post, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => setSelectedPost(post)}
                                                        className={`h-2 w-2 rounded-full transition-transform hover:scale-125 ${platformColors[post.platform] || 'bg-muted-foreground'} ${post.scheduled_for ? 'ring-2 ring-primary ring-offset-1' : ''}`}
                                                        title={`${post.platform} - ${post.scheduled_for ? 'Scheduled' : 'Generated'}`}
                                                    />
                                                ))}
                                                {dayPosts.length > 4 && (
                                                    <span className="text-[10px] text-muted-foreground">+{dayPosts.length - 4}</span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Legend */}
                    <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-border pt-4 text-sm text-muted-foreground">
                        <span>Legend:</span>
                        <div className="flex items-center gap-1.5">
                            <span className="h-3 w-3 rounded-full bg-[#1877F2]" />
                            Facebook
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="h-3 w-3 rounded-full bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737]" />
                            Instagram
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="h-3 w-3 rounded-full bg-black" />
                            TikTok
                        </div>
                        <div className="flex items-center gap-1.5 ml-4">
                            <span className="h-3 w-3 rounded-full bg-primary ring-2 ring-primary ring-offset-1" />
                            Scheduled
                        </div>
                    </div>
                </div>

                {/* Upcoming Posts Card */}
                <div className="rounded-2xl border border-border bg-card p-6">
                    <h3 className="mb-4 text-lg font-semibold">Upcoming Scheduled Posts</h3>

                    {scheduledPosts.length > 0 ? (
                        <div className="space-y-4">
                            {scheduledPosts.filter(p => new Date(p.scheduled_for!) >= new Date()).slice(0, 5).map(post => (
                                <div
                                    key={post.id}
                                    className="flex items-center gap-4 rounded-lg border border-border p-3 transition-colors hover:bg-secondary cursor-pointer"
                                    onClick={() => setSelectedPost(post)}
                                >
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg text-white ${platformColors[post.platform]}`}>
                                        <Sparkles className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="font-medium">
                                            {new Date(post.scheduled_for!).toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' })}
                                        </p>
                                        <p className="text-sm text-muted-foreground capitalize">{post.variant_type} • {post.platform}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                                <CalendarIcon className="h-7 w-7 text-muted-foreground" />
                            </div>
                            <h3 className="font-medium">No posts scheduled</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Generate content and schedule it to see your plan here
                            </p>
                        </div>
                    )}
                </div>
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
                                    <div className={`flex h-8 w-8 items-center justify-center rounded-md text-white ${platformColors[selectedPost.platform]}`}>
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
                                <span className="font-medium text-foreground">Scheduled: </span>
                                {selectedPost.scheduled_for
                                    ? new Date(selectedPost.scheduled_for).toLocaleString('ro-RO')
                                    : 'Not scheduled (Generated: ' + new Date(selectedPost.generated_at).toLocaleDateString() + ')'}
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
                                    onClick={() => handleCopy(selectedPost.content, selectedPost.hashtags)}
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
        </div>
    );
}
