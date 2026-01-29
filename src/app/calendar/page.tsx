'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchCalendarEvents, fetchPostHistory } from '@/lib/actions';
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
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, [currentDate]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [eventsResult, postsResult] = await Promise.all([
                fetchCalendarEvents(),
                fetchPostHistory()
            ]);

            if (eventsResult.success && eventsResult.events) {
                setEvents(eventsResult.events);
            }
            if (postsResult.success && postsResult.posts) {
                setPosts(postsResult.posts);
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
        return posts.filter(p => p.generated_at.startsWith(dateStr));
    };

    const days = getDaysInMonth();

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

                                return (
                                    <div
                                        key={index}
                                        className={`min-h-[80px] border-b border-r border-border p-2 transition-colors md:min-h-[100px] ${!dayInfo.isCurrentMonth ? 'bg-muted/30 text-muted-foreground' : 'bg-card hover:bg-secondary/50'
                                            } ${index % 7 === 6 ? 'border-r-0' : ''}`}
                                    >
                                        <span className={`inline-flex h-7 w-7 items-center justify-center text-sm font-medium ${today ? 'rounded-full bg-primary text-primary-foreground' : ''
                                            }`}>
                                            {dayInfo.day}
                                        </span>
                                        {dayPosts.length > 0 && (
                                            <div className="mt-1 flex flex-wrap gap-1">
                                                {dayPosts.slice(0, 3).map((post, i) => (
                                                    <span
                                                        key={i}
                                                        className={`h-2 w-2 rounded-full ${platformColors[post.platform] || 'bg-muted-foreground'}`}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Legend */}
                    <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-border pt-4 text-sm text-muted-foreground">
                        <span>Platforms:</span>
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
                    </div>
                </div>

                {/* Upcoming Posts Card */}
                <div className="rounded-2xl border border-border bg-card p-6">
                    <h3 className="mb-4 text-lg font-semibold">Upcoming Posts</h3>

                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                            <CalendarIcon className="h-7 w-7 text-muted-foreground" />
                        </div>
                        <h3 className="font-medium">No scheduled posts yet</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Generate some posts and schedule them to see them here
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
