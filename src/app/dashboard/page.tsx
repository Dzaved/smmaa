'use client';

import { useState, useCallback, useEffect } from 'react';
import { logout } from '@/lib/auth';
import { generatePost, ratePost, markPostUsed, togglePostFavorite, schedulePost } from '@/lib/actions';
import type { Platform, PostType, Tone, GeneratedPost, WordCount, BrandSettings } from '@/lib/brain';
import { DEFAULT_BRAND_SETTINGS } from '@/lib/brain/types';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, Facebook, Instagram, Calendar, Image, Film, Copy, Check, Clock, Loader2 } from 'lucide-react';
import CustomSelect from '@/components/CustomSelect';
import Navigation from '@/components/Navigation';
import { AIThinking } from '@/components/AIThinking';

export default function Dashboard() {
    const router = useRouter();
    const [platform, setPlatform] = useState<Platform>('facebook');
    const [postType, setPostType] = useState<PostType>('informative');
    const [tone, setTone] = useState<Tone>('cald');
    const [wordCount, setWordCount] = useState<WordCount>('medium');
    const [customPrompt, setCustomPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [variants, setVariants] = useState<GeneratedPost[]>([]);
    const [error, setError] = useState('');
    const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

    // Media state
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [brandSettings, setBrandSettings] = useState<BrandSettings>(DEFAULT_BRAND_SETTINGS);
    const [hasCustomSettings, setHasCustomSettings] = useState(false);
    const [schedulingPostId, setSchedulingPostId] = useState<string | null>(null);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [scheduleDate, setScheduleDate] = useState('');

    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => {
                setNotification(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const handleSchedule = async (postId: string) => {
        if (!scheduleDate) return;

        // Optimistic update
        setVariants(prev => prev.map(p =>
            p.id === postId ? { ...p, scheduledFor: scheduleDate } : p
        ));
        setSchedulingPostId(null);
        setScheduleDate('');

        try {
            const response = await schedulePost(postId, scheduleDate);
            if (!response.success) {
                // Revert on failure
                setVariants(prev => prev.map(p =>
                    p.id === postId ? { ...p, scheduledFor: undefined } : p
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

    const handleGenerate = async () => {
        setLoading(true);
        setError('');
        setVariants([]);

        try {
            let mediaBase64: string | undefined;
            let mediaMimeType: string | undefined;

            if (mediaFile) {
                const reader = new FileReader();
                const base64Promise = new Promise<string>((resolve, reject) => {
                    reader.onload = () => {
                        const result = reader.result as string;
                        resolve(result.split(',')[1]);
                    };
                    reader.onerror = reject;
                });
                reader.readAsDataURL(mediaFile);
                mediaBase64 = await base64Promise;
                mediaMimeType = mediaFile.type;
            }

            const response = await generatePost({
                platform,
                postType,
                tone,
                customPrompt: customPrompt || undefined,
                wordCount,
                mediaBase64,
                mediaMimeType,
                brandSettings,
            });

            if (response.success && response.variants) {
                setVariants(response.variants);
            } else if (response.success && response.data) {
                setVariants([{
                    variant: {
                        type: 'emotional',
                        content: response.data.content,
                        hook: '',
                        body: response.data.content,
                        cta: '',
                        temperatureUsed: 0.7,
                    },
                    hashtags: response.data.hashtags,
                    tip: response.data.tip,
                    engagementScore: 75,
                    visualSuggestion: '',
                    bestPostingTime: '18:00-20:00',
                }]);
            } else {
                setError(response.error || 'Eroare necunoscută');
            }
        } catch {
            setError('Eroare de conexiune. Încearcă din nou.');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = async (text: string, index: number) => {
        await navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file && (file.type.startsWith('image/') || file.type.startsWith('video/'))) {
            setMediaFile(file);
            setMediaPreviewUrl(URL.createObjectURL(file));
        }
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setMediaFile(file);
            setMediaPreviewUrl(URL.createObjectURL(file));
        }
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
            {/* Main Content */}
            <main className="container mx-auto px-4 pb-24 md:pb-12">
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Left Column: Input Form */}
                    <div className="space-y-6">
                        <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
                            <div className="mb-6">
                                <h2 className="text-lg font-semibold">Generate Content</h2>
                                <p className="mt-1 text-sm text-muted-foreground">Create engaging funeral services content</p>
                            </div>

                            {/* Platform Selector */}
                            <div className="mb-6">
                                <label className="mb-2 block text-sm font-medium">Select Platform</label>
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                                    <button
                                        onClick={() => setPlatform('facebook')}
                                        className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${platform === 'facebook'
                                            ? 'border-transparent bg-[#1877F2] text-white'
                                            : 'border-border bg-card text-foreground hover:border-foreground/30'
                                            }`}
                                    >
                                        <Facebook className="h-4 w-4" />
                                        Facebook
                                    </button>
                                    <button
                                        onClick={() => setPlatform('instagram')}
                                        className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${platform === 'instagram'
                                            ? 'border-transparent bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white'
                                            : 'border-border bg-card text-foreground hover:border-foreground/30'
                                            }`}
                                    >
                                        <Instagram className="h-4 w-4" />
                                        Instagram
                                    </button>
                                    <button
                                        onClick={() => setPlatform('tiktok')}
                                        className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${platform === 'tiktok'
                                            ? 'border-transparent bg-black text-white'
                                            : 'border-border bg-card text-foreground hover:border-foreground/30'
                                            }`}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                                        </svg>
                                        TikTok
                                    </button>
                                </div>
                            </div>

                            {/* Post Type & Tone */}
                            <div className="mb-6 grid gap-4 sm:grid-cols-2">
                                <div>
                                    <CustomSelect
                                        label="Post Type"
                                        value={postType}
                                        onChange={(val) => setPostType(val as PostType)}
                                        options={[
                                            {
                                                value: 'supportive',
                                                label: 'Memorial / Comemorativ',
                                                description: 'Mesaje respectuoase pentru a onora memoria celor decedați și pentru a oferi sprijin familiilor îndoliate.'
                                            },
                                            {
                                                value: 'service',
                                                label: 'Servicii Funerare',
                                                description: 'Detalii despre pachete funerare, transport, sicrie sau alte servicii oferite de firma dvs.'
                                            },
                                            {
                                                value: 'informative',
                                                label: 'Educativ / Informativ',
                                                description: 'Ghiduri utile despre proceduri legale, acte necesare și pașii de urmat în caz de deces.'
                                            },
                                            {
                                                value: 'community',
                                                label: 'Comunitate',
                                                description: 'Mesaje de implicare în comunitate, anunțuri locale sau mulțumiri adresate clienților.'
                                            },
                                            {
                                                value: 'seasonal',
                                                label: 'Sezonier / Religios',
                                                description: 'Mesaje adaptate sărbătorilor religioase (Paște, Crăciun) sau pomenirilor specifice.'
                                            },
                                        ]}
                                    />
                                </div>
                                <div>
                                    <CustomSelect
                                        label="Tone"
                                        value={tone}
                                        onChange={(val) => setTone(val as Tone)}
                                        options={[
                                            {
                                                value: 'formal',
                                                label: 'Formal',
                                                description: 'Profesionist, sobru și respectuos. Potrivit pentru anunțuri oficiale și servicii.'
                                            },
                                            {
                                                value: 'cald',
                                                label: 'Cald',
                                                description: 'Empatic și prietenos, dar păstrând decența. Ideal pentru educare și comunitate.'
                                            },
                                            {
                                                value: 'compasionat',
                                                label: 'Compasionat',
                                                description: 'Foarte sensibil și emoțional. Concentrat pe suport moral și alinare pentru familii.'
                                            },
                                        ]}
                                    />
                                </div>
                            </div>

                            {/* Word Count */}
                            <div className="mb-6">
                                <label className="mb-2 block text-sm font-medium">Length</label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        onClick={() => setWordCount('short')}
                                        className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${wordCount === 'short'
                                            ? 'border-foreground bg-foreground text-background'
                                            : 'border-border bg-background hover:bg-secondary'
                                            }`}
                                    >
                                        Scurt
                                    </button>
                                    <button
                                        onClick={() => setWordCount('medium')}
                                        className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${wordCount === 'medium'
                                            ? 'border-foreground bg-foreground text-background'
                                            : 'border-border bg-background hover:bg-secondary'
                                            }`}
                                    >
                                        Mediu
                                    </button>
                                    <button
                                        onClick={() => setWordCount('long')}
                                        className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${wordCount === 'long'
                                            ? 'border-foreground bg-foreground text-background'
                                            : 'border-border bg-background hover:bg-secondary'
                                            }`}
                                    >
                                        Lung
                                    </button>
                                </div>
                            </div>

                            {/* Media Upload */}
                            <div className="mb-6">
                                <label className="mb-2 block text-sm font-medium">Upload Media (Optional)</label>
                                <div
                                    className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all ${dragOver
                                        ? 'border-accent bg-accent/5'
                                        : 'border-border hover:border-muted-foreground hover:bg-secondary/50'
                                        }`}
                                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={handleDrop}
                                    onClick={() => document.getElementById('file-input')?.click()}
                                >
                                    {mediaPreviewUrl ? (
                                        <div className="relative inline-block">
                                            <img
                                                src={mediaPreviewUrl}
                                                alt="Preview"
                                                className="mx-auto max-h-48 rounded-lg"
                                            />
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setMediaFile(null); setMediaPreviewUrl(null); }}
                                                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-white hover:opacity-90"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="mb-2 flex justify-center gap-3 text-muted-foreground">
                                                <Image className="h-6 w-6" />
                                                <Film className="h-6 w-6" />
                                            </div>
                                            <p className="font-medium">Drop image or video</p>
                                            <p className="mt-1 text-sm text-accent">or click to browse</p>
                                        </>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    id="file-input"
                                    accept="image/*,video/*"
                                    className="hidden"
                                    onChange={handleFileSelect}
                                />
                            </div>

                            {/* Context / Description */}
                            <div className="mb-6">
                                <label className="mb-2 block text-sm font-medium">Context / Information</label>
                                <textarea
                                    className="min-h-[120px] w-full resize-none rounded-lg border border-border bg-background p-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
                                    placeholder="Describe the deceased details, service info, or specific message you want to convey..."
                                    value={customPrompt}
                                    onChange={(e) => setCustomPrompt(e.target.value)}
                                />
                            </div>

                            {/* Generate Button */}
                            <button
                                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                                onClick={handleGenerate}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Generating Content...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-5 w-5" />
                                        Generate Post
                                    </>
                                )}
                            </button>

                            {error && (
                                <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
                                    {error}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Results */}
                    <div className="space-y-6">
                        {variants.length > 0 ? (
                            <div className="space-y-4">
                                {variants.map((post, index) => (
                                    <div key={index} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                                        <div className="mb-4 flex items-start justify-between">
                                            <div className="flex flex-wrap gap-2">
                                                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium capitalize">
                                                    {post.variant.type}
                                                </span>
                                                <span className="rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-600">
                                                    {post.engagementScore}% score
                                                </span>
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${schedulingPostId === post.id
                                                        ? 'border-primary bg-primary text-primary-foreground'
                                                        : 'border-border bg-secondary hover:bg-border'
                                                        }`}
                                                    onClick={() => {
                                                        if (schedulingPostId === post.id) {
                                                            setSchedulingPostId(null);
                                                        } else if (post.id) {
                                                            setSchedulingPostId(post.id);
                                                            setScheduleDate('');
                                                        }
                                                    }}
                                                >
                                                    <Calendar className="h-4 w-4" />
                                                    {post.scheduledFor ? 'Reschedule' : 'Schedule'}
                                                </button>
                                                <button
                                                    className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-2 text-sm font-medium transition-colors hover:bg-border"
                                                    onClick={() => handleCopy(post.variant.content + '\n\n' + post.hashtags.join(' '), index)}
                                                >
                                                    {copiedIndex === index ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                                    {copiedIndex === index ? 'Copied' : 'Copy'}
                                                </button>
                                            </div>
                                        </div>

                                        {schedulingPostId === post.id && (
                                            <div className="mb-4 flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
                                                <Calendar className="h-4 w-4 text-primary" />
                                                <input
                                                    type="date"
                                                    className="flex-1 rounded-md border border-border bg-background px-3 py-1 text-sm"
                                                    value={scheduleDate}
                                                    onChange={(e) => setScheduleDate(e.target.value)}
                                                    min={new Date().toISOString().split('T')[0]}
                                                />
                                                <button
                                                    onClick={() => handleSchedule(post.id!)}
                                                    disabled={!scheduleDate}
                                                    className="rounded-md bg-primary px-3 py-1 text-sm font-medium text-primary-foreground disabled:opacity-50"
                                                >
                                                    Confirm
                                                </button>
                                            </div>
                                        )}

                                        <p className="mb-4 whitespace-pre-wrap leading-relaxed text-sm">
                                            {post.variant.content}
                                        </p>

                                        <p className="mb-4 text-sm font-medium text-accent">
                                            {post.hashtags.join(' ')}
                                        </p>

                                        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground border-t border-border pt-4">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3.5 w-3.5" />
                                                Best time: {post.bestPostingTime}
                                            </span>
                                            {post.tip && <span>💡 {post.tip}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
                                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                                    <Sparkles className="h-7 w-7 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-medium">Generated content will appear here</h3>
                                <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                                    Fill out the form on the left and click Generate to see AI-created posts for your funeral home.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Centered Notification Toast */}
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
            {/* AI Thinking Overlay */}
            <AIThinking isActive={loading} />
        </div>
    );
}
