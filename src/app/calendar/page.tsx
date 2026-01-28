'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchCalendarEvents, fetchPostHistory } from '@/lib/actions';

interface CalendarEvent {
    id: string;
    name_ro: string;
    date: string;
    event_type: string;
    importance: number;
    content_themes: string[];
    tone_recommendation: string;
    avoid_sales: boolean;
}

interface Post {
    id: string;
    platform: string;
    variant_type: string;
    generated_at: string;
}

const WEEKDAYS = ['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'];
const MONTHS = [
    'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
    'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
];

export default function CalendarPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [posts, setPosts] = useState<Post[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [eventsResult, postsResult] = await Promise.all([
                fetchCalendarEvents(),
                fetchPostHistory(100)
            ]);
            if (eventsResult.success) setEvents(eventsResult.events as CalendarEvent[]);
            if (postsResult.success) setPosts(postsResult.posts as Post[]);
        } catch (error) {
            console.error('Failed to load calendar data:', error);
        }
        setLoading(false);
    };

    const getDaysInMonth = (date: Date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDay = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Monday = 0

        return { daysInMonth, startingDay };
    };

    const getEventsForDate = (day: number) => {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return events.filter(e => e.date === dateStr);
    };

    const getPostsForDate = (day: number) => {
        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return posts.filter(p => p.generated_at.startsWith(dateStr));
    };

    const isToday = (day: number) => {
        const today = new Date();
        return today.getDate() === day &&
            today.getMonth() === currentDate.getMonth() &&
            today.getFullYear() === currentDate.getFullYear();
    };

    const navigateMonth = (direction: number) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + direction);
            return newDate;
        });
    };

    const { daysInMonth, startingDay } = getDaysInMonth(currentDate);

    const renderCalendarDays = () => {
        const days = [];

        // Empty cells for days before the first day of the month
        for (let i = 0; i < startingDay; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        // Actual days
        for (let day = 1; day <= daysInMonth; day++) {
            const dayEvents = getEventsForDate(day);
            const dayPosts = getPostsForDate(day);
            const hasEvent = dayEvents.length > 0;
            const hasPost = dayPosts.length > 0;
            const today = isToday(day);

            days.push(
                <div
                    key={day}
                    className={`calendar-day ${today ? 'today' : ''} ${hasEvent ? 'has-event' : ''} ${hasPost ? 'has-post' : ''}`}
                    onClick={() => setSelectedDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
                >
                    <span className="day-number">{day}</span>
                    {hasEvent && (
                        <div className="event-indicators">
                            {dayEvents.slice(0, 2).map((e, i) => (
                                <span key={i} className="event-dot" title={e.name_ro}>
                                    {'⭐'.repeat(Math.min(e.importance, 3))}
                                </span>
                            ))}
                        </div>
                    )}
                    {hasPost && <span className="post-indicator">📝 {dayPosts.length}</span>}
                </div>
            );
        }

        return days;
    };

    const selectedDateEvents = selectedDate
        ? events.filter(e => e.date === `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`)
        : [];

    const selectedDatePosts = selectedDate
        ? posts.filter(p => p.generated_at.startsWith(`${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`))
        : [];

    // Get upcoming events (next 30 days)
    const today = new Date();
    const upcomingEvents = events
        .filter(e => {
            const eventDate = new Date(e.date);
            const diffDays = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return diffDays >= 0 && diffDays <= 30;
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 5);

    return (
        <div className="calendar-page">
            <header className="calendar-header">
                <Link href="/dashboard" className="back-link">
                    ← Înapoi la Dashboard
                </Link>
                <h1>📅 Calendar Conținut</h1>
                <p className="subtitle">Planifică postările în funcție de sărbători și evenimente</p>
            </header>

            <div className="calendar-layout">
                {/* Main Calendar */}
                <div className="calendar-main">
                    {/* Month Navigation */}
                    <div className="month-nav">
                        <button onClick={() => navigateMonth(-1)} className="nav-btn">‹</button>
                        <h2>{MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}</h2>
                        <button onClick={() => navigateMonth(1)} className="nav-btn">›</button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="calendar-grid">
                        {WEEKDAYS.map(day => (
                            <div key={day} className="weekday-header">{day}</div>
                        ))}
                        {loading ? (
                            <div className="loading-placeholder">Se încarcă...</div>
                        ) : (
                            renderCalendarDays()
                        )}
                    </div>

                    {/* Legend */}
                    <div className="calendar-legend">
                        <span className="legend-item"><span className="dot today-dot"></span> Astăzi</span>
                        <span className="legend-item"><span className="dot event-dot-legend"></span> Sărbătoare</span>
                        <span className="legend-item"><span className="dot post-dot"></span> Postări generate</span>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="calendar-sidebar">
                    {/* Upcoming Events */}
                    <div className="sidebar-section">
                        <h3>🗓️ Evenimente Apropiate</h3>
                        {upcomingEvents.length === 0 ? (
                            <p className="empty-message">Nu sunt evenimente în următoarele 30 zile.</p>
                        ) : (
                            <ul className="event-list">
                                {upcomingEvents.map(event => {
                                    const eventDate = new Date(event.date);
                                    const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                                    return (
                                        <li key={event.id} className="event-item">
                                            <div className="event-date">
                                                <span className="day">{eventDate.getDate()}</span>
                                                <span className="month">{MONTHS[eventDate.getMonth()].slice(0, 3)}</span>
                                            </div>
                                            <div className="event-details">
                                                <strong>{event.name_ro}</strong>
                                                <span className="days-until">
                                                    {daysUntil === 0 ? 'Astăzi!' : `în ${daysUntil} zile`}
                                                </span>
                                                <span className="event-themes">
                                                    {event.content_themes.slice(0, 2).join(', ')}
                                                </span>
                                            </div>
                                            <span className="importance">{'⭐'.repeat(event.importance)}</span>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    {/* Selected Date Details */}
                    {selectedDate && (
                        <div className="sidebar-section selected-details">
                            <h3>
                                📌 {selectedDate.getDate()} {MONTHS[selectedDate.getMonth()]}
                            </h3>

                            {selectedDateEvents.length > 0 && (
                                <div className="selected-events">
                                    <h4>Sărbători:</h4>
                                    {selectedDateEvents.map(event => (
                                        <div key={event.id} className="selected-event-card">
                                            <strong>{event.name_ro}</strong>
                                            <p><strong>Teme:</strong> {event.content_themes.join(', ')}</p>
                                            <p><strong>Ton:</strong> {event.tone_recommendation}</p>
                                            {event.avoid_sales && (
                                                <p className="warning">⚠️ Evită mesajele comerciale</p>
                                            )}
                                            <Link
                                                href={`/dashboard?event=${encodeURIComponent(event.name_ro)}`}
                                                className="generate-btn"
                                            >
                                                ✨ Generează conținut
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {selectedDatePosts.length > 0 && (
                                <div className="selected-posts">
                                    <h4>Postări generate ({selectedDatePosts.length}):</h4>
                                    {selectedDatePosts.map(post => (
                                        <div key={post.id} className="post-mini">
                                            <span className="platform">{post.platform}</span>
                                            <span className="variant">{post.variant_type}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {selectedDateEvents.length === 0 && selectedDatePosts.length === 0 && (
                                <p className="empty-message">Nicio activitate în această zi.</p>
                            )}
                        </div>
                    )}

                    {/* Posting Tips */}
                    <div className="sidebar-section tips">
                        <h3>💡 Sfaturi</h3>
                        <ul>
                            <li>Postează <strong>3-5 zile</strong> înainte de sărbători</li>
                            <li>Evită mesajele comerciale în zilele de pomenire</li>
                            <li>Cele mai bune ore: <strong>18:00-20:00</strong></li>
                            <li>Alternează între tipurile de conținut</li>
                        </ul>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .calendar-page {
                    max-width: 1400px;
                    margin: 0 auto;
                    padding: 2rem;
                }

                .calendar-header {
                    text-align: center;
                    margin-bottom: 2rem;
                    position: relative;
                }

                .back-link {
                    position: absolute;
                    left: 0;
                    top: 0;
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
                    color: white;
                }

                .calendar-header h1 {
                    font-size: 2rem;
                    color: #1a1a2e;
                    margin-bottom: 0.5rem;
                }

                .subtitle {
                    color: #6b7280;
                }

                .calendar-layout {
                    display: grid;
                    grid-template-columns: 1fr 350px;
                    gap: 2rem;
                }

                @media (max-width: 1024px) {
                    .calendar-layout {
                        grid-template-columns: 1fr;
                    }
                }

                .calendar-main {
                    background: white;
                    border-radius: 16px;
                    padding: 1.5rem;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }

                .month-nav {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }

                .month-nav h2 {
                    font-size: 1.5rem;
                    color: #1a1a2e;
                }

                .nav-btn {
                    width: 40px;
                    height: 40px;
                    border: 2px solid #e5e7eb;
                    background: white;
                    border-radius: 8px;
                    font-size: 1.5rem;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .nav-btn:hover {
                    background: #667eea;
                    border-color: #667eea;
                    color: white;
                }

                .calendar-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 4px;
                }

                .weekday-header {
                    text-align: center;
                    font-weight: 600;
                    color: #6b7280;
                    padding: 0.75rem;
                    font-size: 0.875rem;
                }

                .calendar-day {
                    aspect-ratio: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: flex-start;
                    padding: 0.5rem;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.2s ease;
                    border: 2px solid transparent;
                    background: #f9fafb;
                    min-height: 80px;
                }

                .calendar-day.empty {
                    background: transparent;
                    cursor: default;
                }

                .calendar-day:not(.empty):hover {
                    border-color: #667eea;
                    background: #f0f4ff;
                }

                .calendar-day.today {
                    background: #667eea;
                    color: white;
                }

                .calendar-day.today .day-number {
                    color: white;
                }

                .calendar-day.has-event {
                    background: #fef3c7;
                }

                .calendar-day.has-event.today {
                    background: linear-gradient(135deg, #667eea, #764ba2);
                }

                .day-number {
                    font-weight: 600;
                    font-size: 1rem;
                    color: #374151;
                }

                .event-indicators {
                    margin-top: 4px;
                    font-size: 0.625rem;
                    display: flex;
                    gap: 2px;
                }

                .post-indicator {
                    font-size: 0.625rem;
                    color: #10b981;
                    margin-top: auto;
                }

                .calendar-legend {
                    display: flex;
                    justify-content: center;
                    gap: 2rem;
                    margin-top: 1.5rem;
                    padding-top: 1rem;
                    border-top: 1px solid #e5e7eb;
                }

                .legend-item {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-size: 0.875rem;
                    color: #6b7280;
                }

                .dot {
                    width: 12px;
                    height: 12px;
                    border-radius: 50%;
                }

                .today-dot { background: #667eea; }
                .event-dot-legend { background: #fbbf24; }
                .post-dot { background: #10b981; }

                .calendar-sidebar {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .sidebar-section {
                    background: white;
                    border-radius: 16px;
                    padding: 1.25rem;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }

                .sidebar-section h3 {
                    font-size: 1.125rem;
                    color: #1a1a2e;
                    margin-bottom: 1rem;
                }

                .event-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .event-item {
                    display: flex;
                    gap: 1rem;
                    padding: 0.75rem 0;
                    border-bottom: 1px solid #f3f4f6;
                    align-items: flex-start;
                }

                .event-item:last-child {
                    border-bottom: none;
                }

                .event-date {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    background: #667eea;
                    color: white;
                    padding: 0.5rem;
                    border-radius: 8px;
                    min-width: 50px;
                }

                .event-date .day {
                    font-size: 1.25rem;
                    font-weight: 700;
                }

                .event-date .month {
                    font-size: 0.625rem;
                    text-transform: uppercase;
                }

                .event-details {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 0.25rem;
                }

                .event-details strong {
                    color: #1a1a2e;
                    font-size: 0.9rem;
                }

                .days-until {
                    font-size: 0.75rem;
                    color: #667eea;
                    font-weight: 500;
                }

                .event-themes {
                    font-size: 0.75rem;
                    color: #6b7280;
                }

                .importance {
                    font-size: 0.75rem;
                }

                .selected-details h3 {
                    color: #667eea;
                }

                .selected-event-card {
                    background: #f9fafb;
                    padding: 1rem;
                    border-radius: 8px;
                    margin-bottom: 0.75rem;
                }

                .selected-event-card p {
                    font-size: 0.875rem;
                    color: #4b5563;
                    margin: 0.5rem 0;
                }

                .selected-event-card .warning {
                    color: #dc2626;
                    font-weight: 500;
                }

                .generate-btn {
                    display: inline-block;
                    margin-top: 0.75rem;
                    padding: 0.5rem 1rem;
                    background: #667eea;
                    color: white;
                    border-radius: 8px;
                    text-decoration: none;
                    font-weight: 500;
                    font-size: 0.875rem;
                    transition: all 0.2s ease;
                }

                .generate-btn:hover {
                    background: #5a67d8;
                }

                .post-mini {
                    display: flex;
                    gap: 0.5rem;
                    padding: 0.5rem;
                    background: #f3f4f6;
                    border-radius: 6px;
                    margin-bottom: 0.5rem;
                    font-size: 0.75rem;
                }

                .platform {
                    background: #667eea;
                    color: white;
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                }

                .variant {
                    background: #10b981;
                    color: white;
                    padding: 0.25rem 0.5rem;
                    border-radius: 4px;
                }

                .tips ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .tips li {
                    padding: 0.5rem 0;
                    font-size: 0.875rem;
                    color: #4b5563;
                    border-bottom: 1px solid #f3f4f6;
                }

                .tips li:last-child {
                    border-bottom: none;
                }

                .empty-message {
                    color: #9ca3af;
                    font-size: 0.875rem;
                    font-style: italic;
                }

                .loading-placeholder {
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 3rem;
                    color: #6b7280;
                }
            `}</style>
        </div>
    );
}
