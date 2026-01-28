'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { manageKnowledgeBase } from '@/lib/actions';

interface BrandVoice {
    id?: string;
    company_name: string;
    tone_formal: number; // 1-10 scale
    tone_emotional: number;
    tone_religious: number;
    forbidden_words: string[];
    preferred_phrases: string[];
    description: string;
}

interface Settings {
    autoSaveHistory: boolean;
    defaultPlatform: string;
    defaultTone: string;
    defaultWordCount: string;
}

interface KnowledgeEntry {
    id: string;
    title: string;
    content: string;
    category?: string;
    is_active: boolean;
}

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'brand' | 'preferences' | 'knowledge'>('brand');
    const [saveMessage, setSaveMessage] = useState('');

    // Brand Voice State
    const [brandVoice, setBrandVoice] = useState<BrandVoice>({
        company_name: 'Funebra Brașov',
        tone_formal: 7,
        tone_emotional: 6,
        tone_religious: 5,
        forbidden_words: ['Nu ratați', 'Ofertă specială', 'Reducere', 'Grăbiți-vă'],
        preferred_phrases: [],
        description: 'Servicii funerare cu demnitate și respect în Brașov',
    });

    // Preferences State
    const [settings, setSettings] = useState<Settings>({
        autoSaveHistory: true,
        defaultPlatform: 'facebook',
        defaultTone: 'cald',
        defaultWordCount: 'medium',
    });

    // Knowledge Base State
    const [knowledgeStats, setKnowledgeStats] = useState({
        totalEntries: 0,
        totalPosts: 0,
        totalEvents: 0,
    });
    const [knowledgeEntries, setKnowledgeEntries] = useState<KnowledgeEntry[]>([]);
    const [editingEntry, setEditingEntry] = useState<Partial<KnowledgeEntry> | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [knowledgeSearch, setKnowledgeSearch] = useState('');

    // New forbidden word input
    const [newForbiddenWord, setNewForbiddenWord] = useState('');
    const [newPreferredPhrase, setNewPreferredPhrase] = useState('');

    useEffect(() => {
        loadSettings();
    }, []);

    useEffect(() => {
        if (activeTab === 'knowledge') {
            loadKnowledgeBase();
        }
    }, [activeTab]);

    const loadSettings = async () => {
        setLoading(true);
        try {
            // Load brand voice
            const { data: voice } = await supabase
                .from('brand_voice')
                .select('*')
                .single();

            if (voice) {
                setBrandVoice({
                    id: voice.id,
                    company_name: voice.company_name || 'Funebra Brașov',
                    tone_formal: voice.tone_formal || 7,
                    tone_emotional: voice.tone_emotional || 6,
                    tone_religious: voice.tone_religious || 5,
                    forbidden_words: voice.forbidden_words || [],
                    preferred_phrases: voice.preferred_phrases || [],
                    description: voice.description || '',
                });
            }

            // Load stats
            const [knowledgeResult, postsResult, eventsResult] = await Promise.all([
                supabase.from('knowledge_base').select('id', { count: 'exact' }),
                supabase.from('post_history').select('id', { count: 'exact' }),
                supabase.from('calendar_events').select('id', { count: 'exact' }),
            ]);

            setKnowledgeStats({
                totalEntries: knowledgeResult.count || 0,
                totalPosts: postsResult.count || 0,
                totalEvents: eventsResult.count || 0,
            });
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
        setLoading(false);
    };

    const loadKnowledgeBase = async () => {
        try {
            const { data, error } = await supabase
                .from('knowledge_base')
                .select('*')
                .order('created_at', { ascending: false });

            if (data) {
                setKnowledgeEntries(data);
            }
        } catch (error) {
            console.error('Failed to load knowledge base:', error);
        }
    };

    const saveBrandVoice = async () => {
        setSaving(true);
        setSaveMessage('');
        try {
            if (brandVoice.id) {
                await supabase
                    .from('brand_voice')
                    .update({
                        company_name: brandVoice.company_name,
                        tone_formal: brandVoice.tone_formal,
                        tone_emotional: brandVoice.tone_emotional,
                        tone_religious: brandVoice.tone_religious,
                        forbidden_words: brandVoice.forbidden_words,
                        preferred_phrases: brandVoice.preferred_phrases,
                        description: brandVoice.description,
                    })
                    .eq('id', brandVoice.id);
            } else {
                await supabase.from('brand_voice').insert({
                    company_name: brandVoice.company_name,
                    tone_formal: brandVoice.tone_formal,
                    tone_emotional: brandVoice.tone_emotional,
                    tone_religious: brandVoice.tone_religious,
                    forbidden_words: brandVoice.forbidden_words,
                    preferred_phrases: brandVoice.preferred_phrases,
                    description: brandVoice.description,
                });
            }
            setSaveMessage('✅ Salvat cu succes!');
            setTimeout(() => setSaveMessage(''), 3000);
        } catch (error) {
            console.error('Failed to save:', error);
            setSaveMessage('❌ Eroare la salvare');
        }
        setSaving(false);
    };

    const handleSaveEntry = async () => {
        if (!editingEntry?.title || !editingEntry?.content) return;

        setSaving(true);
        try {
            const payload = {
                id: editingEntry.id,
                title: editingEntry.title,
                content: editingEntry.content,
                category: editingEntry.category || 'General',
                is_active: editingEntry.is_active ?? true
            };

            const result = await manageKnowledgeBase(
                editingEntry.id ? 'update' : 'insert',
                payload
            );

            if (!result.success) throw new Error(result.error);

            await loadKnowledgeBase();
            setIsEditing(false);
            setEditingEntry(null);
            setSaveMessage('✅ Salvat cu succes!');
            setTimeout(() => setSaveMessage(''), 3000);
        } catch (error) {
            console.error('Failed to save entry:', error);
            alert(`Eroare la salvare: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
        }
        setSaving(false);
    };

    const handleDeleteEntry = async (id: string) => {
        if (!confirm('Sigur vrei să ștergi această intrare?')) return;

        try {
            const result = await manageKnowledgeBase('delete', { id });
            if (!result.success) throw new Error(result.error);

            await loadKnowledgeBase();
        } catch (error) {
            console.error('Failed to delete entry:', error);
            alert(`Eroare la ștergere: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
        }
    };

    const filteredEntries = knowledgeEntries.filter(entry =>
        entry.title.toLowerCase().includes(knowledgeSearch.toLowerCase()) ||
        entry.content.toLowerCase().includes(knowledgeSearch.toLowerCase())
    );

    const addForbiddenWord = () => {
        if (newForbiddenWord.trim() && !brandVoice.forbidden_words.includes(newForbiddenWord.trim())) {
            setBrandVoice(prev => ({
                ...prev,
                forbidden_words: [...prev.forbidden_words, newForbiddenWord.trim()],
            }));
            setNewForbiddenWord('');
        }
    };

    const removeForbiddenWord = (word: string) => {
        setBrandVoice(prev => ({
            ...prev,
            forbidden_words: prev.forbidden_words.filter(w => w !== word),
        }));
    };

    const addPreferredPhrase = () => {
        if (newPreferredPhrase.trim() && !brandVoice.preferred_phrases.includes(newPreferredPhrase.trim())) {
            setBrandVoice(prev => ({
                ...prev,
                preferred_phrases: [...prev.preferred_phrases, newPreferredPhrase.trim()],
            }));
            setNewPreferredPhrase('');
        }
    };

    const removePreferredPhrase = (phrase: string) => {
        setBrandVoice(prev => ({
            ...prev,
            preferred_phrases: prev.preferred_phrases.filter(p => p !== phrase),
        }));
    };

    return (
        <div className="settings-page">
            <header className="settings-header">
                <Link href="/dashboard" className="back-link">
                    ← Înapoi la Dashboard
                </Link>
                <h1>⚙️ Setări</h1>
                <p className="subtitle">Configurează vocea de brand și preferințele</p>
            </header>

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'brand' ? 'active' : ''}`}
                    onClick={() => setActiveTab('brand')}
                >
                    🎭 Voce Brand
                </button>
                <button
                    className={`tab ${activeTab === 'preferences' ? 'active' : ''}`}
                    onClick={() => setActiveTab('preferences')}
                >
                    ⚡ Preferințe
                </button>
                <button
                    className={`tab ${activeTab === 'knowledge' ? 'active' : ''}`}
                    onClick={() => setActiveTab('knowledge')}
                >
                    📚 Bază Cunoștințe
                </button>
            </div>

            {loading ? (
                <div className="loading-state">Se încarcă...</div>
            ) : (
                <div className="settings-content">
                    {/* Brand Voice Tab */}
                    {activeTab === 'brand' && (
                        <div className="tab-content">
                            <div className="settings-card">
                                <h3>Identitate Brand</h3>

                                <div className="form-group">
                                    <label>Nume Companie</label>
                                    <input
                                        type="text"
                                        value={brandVoice.company_name}
                                        onChange={e => setBrandVoice(prev => ({ ...prev, company_name: e.target.value }))}
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Descriere scurtă</label>
                                    <textarea
                                        value={brandVoice.description}
                                        onChange={e => setBrandVoice(prev => ({ ...prev, description: e.target.value }))}
                                        rows={2}
                                    />
                                </div>
                            </div>

                            <div className="settings-card">
                                <h3>Ajustare Ton</h3>
                                <p className="helper-text">Ajustează balanța tonului pentru conținutul generat</p>

                                <div className="slider-group">
                                    <label>
                                        <span>Formal ← → Informal</span>
                                        <span className="slider-value">{brandVoice.tone_formal}/10</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        value={brandVoice.tone_formal}
                                        onChange={e => setBrandVoice(prev => ({ ...prev, tone_formal: Number(e.target.value) }))}
                                    />
                                    <div className="slider-labels">
                                        <span>Foarte formal</span>
                                        <span>Natural</span>
                                        <span>Casual</span>
                                    </div>
                                </div>

                                <div className="slider-group">
                                    <label>
                                        <span>Nivel Emoțional</span>
                                        <span className="slider-value">{brandVoice.tone_emotional}/10</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        value={brandVoice.tone_emotional}
                                        onChange={e => setBrandVoice(prev => ({ ...prev, tone_emotional: Number(e.target.value) }))}
                                    />
                                    <div className="slider-labels">
                                        <span>Neutru</span>
                                        <span>Empatic</span>
                                        <span>Intens</span>
                                    </div>
                                </div>

                                <div className="slider-group">
                                    <label>
                                        <span>Referințe Religioase</span>
                                        <span className="slider-value">{brandVoice.tone_religious}/10</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="10"
                                        value={brandVoice.tone_religious}
                                        onChange={e => setBrandVoice(prev => ({ ...prev, tone_religious: Number(e.target.value) }))}
                                    />
                                    <div className="slider-labels">
                                        <span>Absent</span>
                                        <span>Subtil</span>
                                        <span>Pronunțat</span>
                                    </div>
                                </div>
                            </div>

                            <div className="settings-card">
                                <h3>Cuvinte Interzise</h3>
                                <p className="helper-text">AI-ul va evita aceste expresii în orice conținut generat</p>

                                <div className="tags-input">
                                    <div className="tags-list">
                                        {brandVoice.forbidden_words.map(word => (
                                            <span key={word} className="tag forbidden">
                                                {word}
                                                <button onClick={() => removeForbiddenWord(word)}>×</button>
                                            </span>
                                        ))}
                                    </div>
                                    <div className="tag-input-row">
                                        <input
                                            type="text"
                                            placeholder="Adaugă cuvânt interzis..."
                                            value={newForbiddenWord}
                                            onChange={e => setNewForbiddenWord(e.target.value)}
                                            onKeyPress={e => e.key === 'Enter' && addForbiddenWord()}
                                        />
                                        <button onClick={addForbiddenWord} className="add-btn">+ Adaugă</button>
                                    </div>
                                </div>
                            </div>

                            <div className="settings-card">
                                <h3>Expresii Preferate</h3>
                                <p className="helper-text">AI-ul va încerca să folosească aceste expresii când e potrivit</p>

                                <div className="tags-input">
                                    <div className="tags-list">
                                        {brandVoice.preferred_phrases.map(phrase => (
                                            <span key={phrase} className="tag preferred">
                                                {phrase}
                                                <button onClick={() => removePreferredPhrase(phrase)}>×</button>
                                            </span>
                                        ))}
                                        {brandVoice.preferred_phrases.length === 0 && (
                                            <span className="empty-text">Nu ai adăugat expresii preferate</span>
                                        )}
                                    </div>
                                    <div className="tag-input-row">
                                        <input
                                            type="text"
                                            placeholder="Adaugă expresie preferată..."
                                            value={newPreferredPhrase}
                                            onChange={e => setNewPreferredPhrase(e.target.value)}
                                            onKeyPress={e => e.key === 'Enter' && addPreferredPhrase()}
                                        />
                                        <button onClick={addPreferredPhrase} className="add-btn">+ Adaugă</button>
                                    </div>
                                </div>
                            </div>

                            <div className="save-bar">
                                {saveMessage && <span className="save-message">{saveMessage}</span>}
                                <button
                                    onClick={saveBrandVoice}
                                    disabled={saving}
                                    className="save-btn"
                                >
                                    {saving ? 'Se salvează...' : '💾 Salvează Setările'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Preferences Tab */}
                    {activeTab === 'preferences' && (
                        <div className="tab-content">
                            <div className="settings-card">
                                <h3>Setări Implicite</h3>

                                <div className="form-group">
                                    <label>Platformă implicită</label>
                                    <select
                                        value={settings.defaultPlatform}
                                        onChange={e => setSettings(prev => ({ ...prev, defaultPlatform: e.target.value }))}
                                    >
                                        <option value="facebook">Facebook</option>
                                        <option value="instagram">Instagram</option>
                                        <option value="tiktok">TikTok</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Ton implicit</label>
                                    <select
                                        value={settings.defaultTone}
                                        onChange={e => setSettings(prev => ({ ...prev, defaultTone: e.target.value }))}
                                    >
                                        <option value="cald">Cald</option>
                                        <option value="profesional">Profesional</option>
                                        <option value="empatic">Empatic</option>
                                        <option value="informativ">Informativ</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Lungime text implicită</label>
                                    <select
                                        value={settings.defaultWordCount}
                                        onChange={e => setSettings(prev => ({ ...prev, defaultWordCount: e.target.value }))}
                                    >
                                        <option value="short">Scurt (15-30 cuvinte)</option>
                                        <option value="medium">Mediu (40-70 cuvinte)</option>
                                        <option value="long">Lung (100-150 cuvinte)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="settings-card">
                                <h3>Comportament</h3>

                                <div className="toggle-group">
                                    <label className="toggle-label">
                                        <input
                                            type="checkbox"
                                            checked={settings.autoSaveHistory}
                                            onChange={e => setSettings(prev => ({ ...prev, autoSaveHistory: e.target.checked }))}
                                        />
                                        <span className="toggle-slider"></span>
                                        <span>Salvează automat în istoric</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Knowledge Base Tab */}
                    {activeTab === 'knowledge' && (
                        <div className="tab-content">
                            <div className="settings-card">
                                <div className="flex-header">
                                    <h3>Gestionare Bază de Cunoștințe</h3>
                                    {!isEditing && (
                                        <button
                                            className="add-new-btn"
                                            onClick={() => {
                                                setEditingEntry({ title: '', content: '', category: 'company' });
                                                setIsEditing(true);
                                            }}
                                        >
                                            + Adaugă Intrare
                                        </button>
                                    )}
                                </div>

                                {isEditing ? (
                                    <div className="edit-form">
                                        <div className="form-group">
                                            <label>Titlu</label>
                                            <input
                                                type="text"
                                                value={editingEntry?.title || ''}
                                                onChange={e => setEditingEntry(prev => ({ ...prev!, title: e.target.value }))}
                                                placeholder="Ex: Politica de prețuri, Servicii transport..."
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label>Categorie</label>
                                            <select
                                                value={editingEntry?.category || 'company'}
                                                onChange={e => setEditingEntry(prev => ({ ...prev!, category: e.target.value }))}
                                            >
                                                <option value="company">Despre Companie</option>
                                                <option value="service">Servicii</option>
                                                <option value="tradition">Tradiții</option>
                                                <option value="value">Valori</option>
                                                <option value="contact">Contact</option>
                                                <option value="product">Produse</option>
                                            </select>
                                        </div>

                                        <div className="form-group">
                                            <label>Conținut</label>
                                            <textarea
                                                rows={8}
                                                value={editingEntry?.content || ''}
                                                onChange={e => setEditingEntry(prev => ({ ...prev!, content: e.target.value }))}
                                                placeholder="Detaliile care vor fi folosite de AI..."
                                            />
                                        </div>

                                        <div className="form-actions">
                                            <button
                                                className="cancel-btn"
                                                onClick={() => {
                                                    setIsEditing(false);
                                                    setEditingEntry(null);
                                                }}
                                            >
                                                Anulează
                                            </button>
                                            <button
                                                className="save-btn"
                                                onClick={handleSaveEntry}
                                                disabled={saving || !editingEntry?.title}
                                            >
                                                {saving ? 'Se salvează...' : '💾 Salvează'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="search-bar">
                                            <input
                                                type="text"
                                                placeholder="🔍 Caută în cunoștințe..."
                                                value={knowledgeSearch}
                                                onChange={e => setKnowledgeSearch(e.target.value)}
                                            />
                                        </div>

                                        <div className="knowledge-list">
                                            {filteredEntries.length === 0 ? (
                                                <div className="empty-state">
                                                    Nu am găsit intrări. Adaugă prima informație despre companie!
                                                </div>
                                            ) : (
                                                filteredEntries.map(entry => (
                                                    <div key={entry.id} className="knowledge-item">
                                                        <div className="knowledge-item-header">
                                                            <div className="knowledge-title">
                                                                <span className="category-badge">{entry.category || 'General'}</span>
                                                                <h4>{entry.title}</h4>
                                                            </div>
                                                            <div className="item-actions">
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingEntry(entry);
                                                                        setIsEditing(true);
                                                                    }}
                                                                    className="edit-icon"
                                                                >
                                                                    ✏️
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteEntry(entry.id)}
                                                                    className="delete-icon"
                                                                >
                                                                    🗑️
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <p className="knowledge-preview">
                                                            {entry.content.length > 150
                                                                ? entry.content.substring(0, 150) + '...'
                                                                : entry.content}
                                                        </p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="settings-card">
                                <h3>Statistici</h3>
                                <div className="stats-grid">
                                    <div className="stat-card">
                                        <div className="stat-icon">📖</div>
                                        <div className="stat-value">{knowledgeStats.totalEntries}</div>
                                        <div className="stat-label">Intrări Knowledge</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-icon">📝</div>
                                        <div className="stat-value">{knowledgeStats.totalPosts}</div>
                                        <div className="stat-label">Postări Generate</div>
                                    </div>
                                    <div className="stat-card">
                                        <div className="stat-icon">📅</div>
                                        <div className="stat-value">{knowledgeStats.totalEvents}</div>
                                        <div className="stat-label">Evenimente Calendar</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <style jsx>{`
                .settings-page {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 2rem;
                }

                .settings-header {
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

                .settings-header h1 {
                    font-size: 2rem;
                    color: #1a1a2e;
                    margin-bottom: 0.5rem;
                }

                .subtitle {
                    color: #6b7280;
                }

                .tabs {
                    display: flex;
                    gap: 0.5rem;
                    margin-bottom: 2rem;
                    background: #f3f4f6;
                    padding: 0.5rem;
                    border-radius: 12px;
                }

                .tab {
                    flex: 1;
                    padding: 0.75rem 1rem;
                    border: none;
                    background: transparent;
                    border-radius: 8px;
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: #6b7280;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .tab:hover {
                    color: #374151;
                }

                .tab.active {
                    background: white;
                    color: #667eea;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }

                .settings-content {
                    animation: fadeIn 0.3s ease;
                }

                .settings-card {
                    background: white;
                    border-radius: 16px;
                    padding: 1.5rem;
                    margin-bottom: 1.5rem;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }

                .settings-card h3 {
                    font-size: 1.125rem;
                    color: #1a1a2e;
                    margin-bottom: 0.5rem;
                }

                .helper-text {
                    font-size: 0.875rem;
                    color: #6b7280;
                    margin-bottom: 1rem;
                }

                .form-group {
                    margin-bottom: 1.25rem;
                }

                .form-group label {
                    display: block;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #374151;
                    margin-bottom: 0.5rem;
                }

                .form-group input,
                .form-group textarea,
                .form-group select {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 1rem;
                    transition: border-color 0.2s ease;
                }

                .form-group input:focus,
                .form-group textarea:focus,
                .form-group select:focus {
                    outline: none;
                    border-color: #667eea;
                }

                .slider-group {
                    margin-bottom: 1.5rem;
                }

                .slider-group label {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.875rem;
                    font-weight: 500;
                    color: #374151;
                    margin-bottom: 0.5rem;
                }

                .slider-value {
                    color: #667eea;
                    font-weight: 600;
                }

                .slider-group input[type="range"] {
                    width: 100%;
                    height: 6px;
                    background: linear-gradient(to right, #667eea, #764ba2);
                    border-radius: 3px;
                    appearance: none;
                    cursor: pointer;
                }

                .slider-group input[type="range"]::-webkit-slider-thumb {
                    appearance: none;
                    width: 20px;
                    height: 20px;
                    background: white;
                    border: 3px solid #667eea;
                    border-radius: 50%;
                    cursor: pointer;
                }

                .slider-labels {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.75rem;
                    color: #9ca3af;
                    margin-top: 0.25rem;
                }

                .tags-input {
                    margin-top: 1rem;
                }

                .tags-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                    margin-bottom: 1rem;
                }

                .tag {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    padding: 0.5rem 0.75rem;
                    border-radius: 20px;
                    font-size: 0.875rem;
                }

                .tag.forbidden {
                    background: #fef2f2;
                    color: #dc2626;
                    border: 1px solid #fecaca;
                }

                .tag.preferred {
                    background: #f0fdf4;
                    color: #16a34a;
                    border: 1px solid #bbf7d0;
                }

                .tag button {
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-size: 1rem;
                    color: inherit;
                    opacity: 0.6;
                    transition: opacity 0.2s;
                }

                .tag button:hover {
                    opacity: 1;
                }

                .tag-input-row {
                    display: flex;
                    gap: 0.5rem;
                }

                .tag-input-row input {
                    flex: 1;
                    padding: 0.75rem 1rem;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 0.9rem;
                }

                .tag-input-row input:focus {
                    outline: none;
                    border-color: #667eea;
                }

                .add-btn {
                    padding: 0.75rem 1rem;
                    background: #f3f4f6;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .add-btn:hover {
                    background: #667eea;
                    border-color: #667eea;
                    color: white;
                }

                .empty-text {
                    color: #9ca3af;
                    font-style: italic;
                    font-size: 0.875rem;
                }

                .save-bar {
                    display: flex;
                    justify-content: flex-end;
                    align-items: center;
                    gap: 1rem;
                    padding: 1rem;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }

                .save-message {
                    font-size: 0.875rem;
                }

                .save-btn {
                    padding: 0.75rem 2rem;
                    background: linear-gradient(135deg, #667eea, #764ba2);
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 1rem;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s ease;
                }

                .save-btn:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
                }

                .save-btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                    transform: none;
                }

                .toggle-group {
                    margin-bottom: 1rem;
                }

                .toggle-label {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    cursor: pointer;
                }

                .toggle-label input {
                    width: 40px;
                    height: 20px;
                    appearance: none;
                    background: #e5e7eb;
                    border-radius: 10px;
                    position: relative;
                    cursor: pointer;
                    transition: background 0.2s ease;
                }

                .toggle-label input:checked {
                    background: #667eea;
                }

                .toggle-label input::after {
                    content: '';
                    position: absolute;
                    top: 2px;
                    left: 2px;
                    width: 16px;
                    height: 16px;
                    background: white;
                    border-radius: 50%;
                    transition: left 0.2s ease;
                }

                .toggle-label input:checked::after {
                    left: 22px;
                }

                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1rem;
                }

                .stat-card {
                    text-align: center;
                    padding: 1.5rem;
                    background: #f9fafb;
                    border-radius: 12px;
                }

                .stat-icon {
                    font-size: 2rem;
                    margin-bottom: 0.5rem;
                }

                .stat-value {
                    font-size: 2rem;
                    font-weight: 700;
                    color: #667eea;
                }

                .stat-label {
                    font-size: 0.875rem;
                    color: #6b7280;
                }

                /* Knowledge Management Styles */
                .flex-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 1.5rem;
                }

                .add-new-btn {
                    padding: 0.5rem 1rem;
                    background: #667eea;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background 0.2s ease;
                }

                .add-new-btn:hover {
                    background: #5a67d8;
                }

                .search-bar {
                    margin-bottom: 1rem;
                }

                .search-bar input {
                    width: 100%;
                    padding: 0.75rem 1rem;
                    border: 2px solid #e5e7eb;
                    border-radius: 8px;
                    font-size: 0.9rem;
                }

                .search-bar input:focus {
                    outline: none;
                    border-color: #667eea;
                }

                .knowledge-list {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    max-height: 500px;
                    overflow-y: auto;
                }

                .knowledge-item {
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                    padding: 1rem;
                    transition: box-shadow 0.2s ease;
                }

                .knowledge-item:hover {
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                }

                .knowledge-item-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 0.5rem;
                }

                .knowledge-title {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .category-badge {
                    font-size: 0.75rem;
                    padding: 0.25rem 0.6rem;
                    background: #e0e7ff;
                    color: #4338ca;
                    border-radius: 12px;
                    font-weight: 600;
                }

                .knowledge-item h4 {
                    font-size: 1rem;
                    color: #1f2937;
                    font-weight: 600;
                    margin: 0;
                }

                .item-actions {
                    display: flex;
                    gap: 0.5rem;
                }

                .edit-icon, .delete-icon {
                    background: none;
                    border: none;
                    cursor: pointer;
                    opacity: 0.6;
                    font-size: 1rem;
                    transition: opacity 0.2s;
                    padding: 0.25rem;
                }

                .edit-icon:hover, .delete-icon:hover {
                    opacity: 1;
                }

                .delete-icon:hover {
                    color: #dc2626;
                }

                .knowledge-preview {
                    color: #6b7280;
                    font-size: 0.875rem;
                    line-height: 1.5;
                    margin: 0;
                }

                .edit-form {
                    background: #f9fafb;
                    padding: 1.5rem;
                    border-radius: 12px;
                    border: 1px solid #e5e7eb;
                }

                .form-actions {
                    display: flex;
                    justify-content: flex-end;
                    gap: 1rem;
                    margin-top: 1.5rem;
                }

                .cancel-btn {
                    padding: 0.75rem 1.5rem;
                    background: white;
                    border: 1px solid #d1d5db;
                    color: #374151;
                    border-radius: 8px;
                    font-weight: 500;
                    cursor: pointer;
                }

                .cancel-btn:hover {
                    background: #f3f4f6;
                }

                .empty-state {
                    text-align: center;
                    padding: 3rem;
                    color: #9ca3af;
                    font-style: italic;
                }

                .loading-state {
                    text-align: center;
                    padding: 3rem;
                    color: #6b7280;
                }
            `}</style>
        </div>
    );
}
