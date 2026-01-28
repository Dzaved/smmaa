'use client';

import { useState, useCallback } from 'react';
import { logout } from '@/lib/auth';
import { generatePost, ratePost, markPostUsed, togglePostFavorite } from '@/lib/actions';
import type { Platform, PostType, Tone, GeneratedPost, WordCount } from '@/lib/brain';
import PlatformSelector from '@/components/PlatformSelector';
import PostTypeSelector from '@/components/PostTypeSelector';
import ToneSelector from '@/components/ToneSelector';
import { AIThinking } from '@/components/AIThinking';
import { VariantCards } from '@/components/VariantCards';
import { MediaUpload } from '@/components/MediaUpload';
import { WordCountSelector } from '@/components/WordCountSelector';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
    const [copiedNotice, setCopiedNotice] = useState(false);

    // Media state
    const [mediaFile, setMediaFile] = useState<File | null>(null);
    const [mediaPreviewUrl, setMediaPreviewUrl] = useState<string | null>(null);

    const handleGenerate = async () => {
        setLoading(true);
        setError('');
        setVariants([]);

        try {
            // Convert media to base64 if present
            let mediaBase64: string | undefined;
            let mediaMimeType: string | undefined;

            if (mediaFile) {
                const reader = new FileReader();
                const base64Promise = new Promise<string>((resolve, reject) => {
                    reader.onload = () => {
                        const result = reader.result as string;
                        // Remove the data:image/...;base64, prefix
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
            });

            if (response.success && response.variants) {
                setVariants(response.variants);
            } else if (response.success && response.data) {
                // Fallback for old format
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

    const handleCopy = () => {
        setCopiedNotice(true);
        setTimeout(() => setCopiedNotice(false), 2000);
    };

    const handleRate = async (postId: string, rating: number) => {
        await ratePost(postId, rating);
    };

    const handleFavorite = async (postId: string, isFavorite: boolean) => {
        await togglePostFavorite(postId, isFavorite);
    };

    const handleMarkUsed = async (postId: string) => {
        await markPostUsed(postId);
    };

    const handleLogout = async () => {
        await logout();
        router.push('/');
        router.refresh();
    };

    const platformLabel = platform === 'facebook' ? 'Facebook' : platform === 'instagram' ? 'Instagram' : 'TikTok';

    return (
        <div>
            {/* AI Thinking Overlay */}
            <AIThinking isActive={loading} />

            <header className="app-header">
                <div className="app-header-inner">
                    <div className="app-logo">
                        <div className="app-logo-icon">🧠</div>
                        <div>
                            <div className="app-logo-text">SMMAA Brain</div>
                            <div className="app-logo-sub">AI pentru Funebra Brașov</div>
                        </div>
                    </div>
                    <nav className="header-nav">
                        <Link href="/history" className="nav-link">
                            📚 Istoric
                        </Link>
                        <button className="btn btn-secondary" onClick={handleLogout}>
                            Deconectare
                        </button>
                    </nav>
                </div>
            </header>

            <main className="app-main">
                <div className="generator-grid">
                    {/* Left Column - Options */}
                    <div className="generator-section">
                        <div className="card">
                            <h3 className="section-title mb-4">1. Alege platforma</h3>
                            <PlatformSelector selected={platform} onChange={setPlatform} />
                        </div>

                        <div className="card">
                            <h3 className="section-title mb-4">2. Tip de postare</h3>
                            <PostTypeSelector selected={postType} onChange={setPostType} />
                        </div>

                        <div className="card">
                            <h3 className="section-title mb-4">3. Tonul mesajului</h3>
                            <ToneSelector selected={tone} onChange={setTone} />
                        </div>

                        <div className="card">
                            <h3 className="section-title mb-4">4. Lungime text</h3>
                            <WordCountSelector selected={wordCount} onChange={setWordCount} />
                        </div>

                        <div className="card">
                            <h3 className="section-title mb-4">5. Imagine/Video (opțional)</h3>
                            <p className="section-description mb-4">AI va analiza și va scrie text bazat pe ce vede</p>
                            <MediaUpload
                                onMediaSelect={setMediaFile}
                                onPreviewUrl={setMediaPreviewUrl}
                                disabled={loading}
                            />
                        </div>

                        <div className="card">
                            <h3 className="section-title">6. Instrucțiuni suplimentare</h3>
                            <p className="section-description mb-4">Opțional: adaugă detalii specifice pentru această postare</p>
                            <textarea
                                className="input textarea"
                                placeholder="Ex: Menționează serviciul de transport, focus pe disponibilitatea 24/7..."
                                value={customPrompt}
                                onChange={(e) => setCustomPrompt(e.target.value)}
                            />
                        </div>

                        <div className="generate-section">
                            <button
                                className="btn btn-accent generate-btn"
                                onClick={handleGenerate}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <span className="loader"></span>
                                        AI Brain gândește...
                                    </>
                                ) : (
                                    <>
                                        🧠 Generează 3 variante pentru {platformLabel}
                                    </>
                                )}
                            </button>

                            {error && (
                                <div className="login-error mt-4">{error}</div>
                            )}
                        </div>
                    </div>

                    {/* Right Column - Output */}
                    <div className="generator-section">
                        {variants.length > 0 ? (
                            <>
                                <div className="results-header">
                                    <h2>🎯 Rezultate Generate</h2>
                                    <p className="text-muted">Alege varianta potrivită și copiază</p>
                                </div>

                                <VariantCards
                                    posts={variants}
                                    onCopy={handleCopy}
                                    onRate={handleRate}
                                    onFavorite={handleFavorite}
                                    onMarkUsed={handleMarkUsed}
                                />

                                {copiedNotice && (
                                    <div className="copy-notice">
                                        ✓ Copiat în clipboard!
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="empty-state">
                                <div className="empty-icon">🧠</div>
                                <h3>AI Brain Pregătit</h3>
                                <p>Configurează opțiunile și apasă &quot;Generează&quot; pentru a crea 3 variante de postări.</p>
                                <div className="feature-list">
                                    <div className="feature-item">✅ 3 variante diferite (sigur, creativ, emoțional)</div>
                                    <div className="feature-item">✅ Principiile psihologiei aplicate</div>
                                    <div className="feature-item">✅ Hashtag-uri optimizate</div>
                                    <div className="feature-item">✅ Scor de engagement</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <style jsx>{`
                .header-nav {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }

                .nav-link {
                    padding: 0.5rem 1rem;
                    color: #667eea;
                    text-decoration: none;
                    font-weight: 500;
                    border-radius: 8px;
                    transition: all 0.2s ease;
                }

                .nav-link:hover {
                    background: rgba(102, 126, 234, 0.1);
                }

                .results-header {
                    margin-bottom: 1rem;
                }

                .results-header h2 {
                    font-size: 1.5rem;
                    margin: 0 0 0.25rem;
                }

                .copy-notice {
                    position: fixed;
                    bottom: 2rem;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #10b981;
                    color: white;
                    padding: 0.75rem 1.5rem;
                    border-radius: 9999px;
                    font-weight: 500;
                    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
                    animation: slideUp 0.3s ease;
                    z-index: 100;
                }

                @keyframes slideUp {
                    from { transform: translateX(-50%) translateY(20px); opacity: 0; }
                    to { transform: translateX(-50%) translateY(0); opacity: 1; }
                }

                .empty-state {
                    background: white;
                    border-radius: 16px;
                    padding: 3rem;
                    text-align: center;
                    border: 2px dashed #e5e7eb;
                }

                .empty-icon {
                    font-size: 4rem;
                    margin-bottom: 1rem;
                }

                .empty-state h3 {
                    font-size: 1.5rem;
                    color: #1a1a2e;
                    margin-bottom: 0.5rem;
                }

                .empty-state p {
                    color: #6b7280;
                    margin-bottom: 1.5rem;
                }

                .feature-list {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                    text-align: left;
                    max-width: 300px;
                    margin: 0 auto;
                }

                .feature-item {
                    font-size: 0.875rem;
                    color: #4b5563;
                }
            `}</style>
        </div>
    );
}

