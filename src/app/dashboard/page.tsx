'use client';

import { useState } from 'react';
import { logout } from '@/lib/auth';
import { generatePost } from '@/lib/actions';
import { Platform, PostType, Tone } from '@/lib/gemini';
import PlatformSelector from '@/components/PlatformSelector';
import PostTypeSelector from '@/components/PostTypeSelector';
import ToneSelector from '@/components/ToneSelector';
import OutputCard from '@/components/OutputCard';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
    const router = useRouter();
    const [platform, setPlatform] = useState<Platform>('facebook');
    const [postType, setPostType] = useState<PostType>('informative');
    const [tone, setTone] = useState<Tone>('cald');
    const [customPrompt, setCustomPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{
        content: string;
        hashtags: string[];
        tip: string;
    } | null>(null);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        setLoading(true);
        setError('');

        try {
            const response = await generatePost({
                platform,
                postType,
                tone,
                customPrompt: customPrompt || undefined
            });

            if (response.success && response.data) {
                setResult(response.data);
            } else {
                setError(response.error || 'Eroare necunoscută');
            }
        } catch {
            setError('Eroare de conexiune. Încearcă din nou.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        router.push('/');
        router.refresh();
    };

    const platformLabel = platform === 'facebook' ? 'Facebook' : platform === 'instagram' ? 'Instagram' : 'TikTok';

    return (
        <div>
            <header className="app-header">
                <div className="app-header-inner">
                    <div className="app-logo">
                        <div className="app-logo-icon">SM</div>
                        <div>
                            <div className="app-logo-text">SMMAA</div>
                            <div className="app-logo-sub">pentru Funebra Brașov</div>
                        </div>
                    </div>
                    <button className="btn btn-secondary" onClick={handleLogout}>
                        Deconectare
                    </button>
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
                            <h3 className="section-title">4. Instrucțiuni suplimentare</h3>
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
                                        Se generează...
                                    </>
                                ) : (
                                    <>
                                        ✨ Generează postare pentru {platformLabel}
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
                        <OutputCard
                            title={`Postare ${platformLabel}`}
                            content={result?.content || ''}
                            hashtags={result?.hashtags}
                            tip={result?.tip}
                            loading={loading}
                        />

                        {result && (
                            <div className="card" style={{ background: 'var(--color-success-bg)', borderColor: 'var(--color-success)' }}>
                                <div className="flex items-center gap-3">
                                    <span style={{ fontSize: '1.5rem' }}>✅</span>
                                    <div>
                                        <strong>Conținut generat cu succes!</strong>
                                        <p className="text-sm text-muted mt-2">
                                            Copiază textul și hashtag-urile, apoi postează manual pe {platformLabel}.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
