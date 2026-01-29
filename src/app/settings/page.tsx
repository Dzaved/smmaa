'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { fetchKnowledgeBase, manageKnowledgeBase } from '@/lib/actions';
import { BrandSettings, DEFAULT_BRAND_SETTINGS } from '@/lib/brain/types';
import { Sparkles, Calendar, History, Settings, Plus, Pencil, Trash2, CheckCircle2, XCircle, Loader2, BookOpen, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface KnowledgeEntry {
    id: string;
    category: string;
    title: string;
    content: string;
    is_active: boolean;
    created_at?: string;
}

export default function SettingsPage() {
    const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentEntry, setCurrentEntry] = useState<Partial<KnowledgeEntry>>({});
    const [saving, setSaving] = useState(false);

    // Initial load
    useEffect(() => {
        loadEntries();
    }, []);

    const loadEntries = async () => {
        setLoading(true);
        const result = await fetchKnowledgeBase();
        if (result.success && result.entries) {
            setEntries(result.entries);
        } else {
            toast.error('Nu am putut încărca baza de cunoștințe');
        }
        setLoading(false);
    };

    const handleEdit = (entry: KnowledgeEntry) => {
        setCurrentEntry(entry);
        setIsEditing(true);
    };

    const handleCreate = () => {
        setCurrentEntry({
            category: 'general',
            is_active: true,
            title: '',
            content: ''
        });
        setIsEditing(true);
    };

    const handleSave = async () => {
        if (!currentEntry.title || !currentEntry.content || !currentEntry.category) {
            toast.error('Toate câmpurile sunt obligatorii');
            return;
        }

        setSaving(true);
        try {
            const action = currentEntry.id ? 'update' : 'insert';
            const result = await manageKnowledgeBase(action, {
                id: currentEntry.id,
                title: currentEntry.title,
                content: currentEntry.content,
                category: currentEntry.category,
                is_active: currentEntry.is_active
            });

            if (result.success) {
                toast.success(currentEntry.id ? 'Intrare actualizată' : 'Intrare creată');
                setIsEditing(false);
                loadEntries();
            } else {
                toast.error(result.error || 'Eroare la salvare');
            }
        } catch (error) {
            toast.error('Eroare neașteptată');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Sigur dorești să ștergi această intrare?')) return;

        const result = await manageKnowledgeBase('delete', { id });
        if (result.success) {
            toast.success('Intrare ștearsă');
            loadEntries();
        } else {
            toast.error(result.error || 'Eroare la ștergere');
        }
    };

    const [activeTab, setActiveTab] = useState<'knowledge' | 'brand'>('brand');

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
                        className="flex min-w-fit items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
                    >
                        <History className="h-4 w-4" />
                        History
                    </Link>
                    <Link
                        href="/settings"
                        className="flex min-w-fit items-center gap-2 rounded-lg bg-card px-4 py-2.5 text-sm font-medium text-foreground shadow-sm"
                    >
                        <Settings className="h-4 w-4" />
                        Settings
                    </Link>
                </nav>
            </div>

            {/* Main Content */}
            <main className="container mx-auto px-4 pb-12">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Setări</h1>
                        <p className="text-muted-foreground">Gestionează identitatea brandului și baza de cunoștințe</p>
                    </div>
                </div>

                {/* Sub-Navigation */}
                <div className="mb-6 flex space-x-1 rounded-xl bg-secondary p-1">
                    <button
                        onClick={() => setActiveTab('brand')}
                        className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${activeTab === 'brand'
                            ? 'bg-card text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Identitate Brand
                    </button>
                    <button
                        onClick={() => setActiveTab('knowledge')}
                        className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-all ${activeTab === 'knowledge'
                            ? 'bg-card text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Baza de Cunoștințe
                    </button>
                </div>

                {activeTab === 'knowledge' ? (
                    <KnowledgeBaseSection
                        entries={entries}
                        loading={loading}
                        onCreate={handleCreate}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                ) : (
                    <BrandIdentitySection />
                )}
            </main>

            {/* Edit/Create Modal */}
            {isEditing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-lg rounded-2xl bg-card p-6 shadow-xl">
                        <h2 className="mb-6 text-xl font-bold">
                            {currentEntry.id ? 'Editează Intrare' : 'Adaugă Intrare Nouă'}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium">Titlu</label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border border-border bg-background px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    value={currentEntry.title || ''}
                                    onChange={e => setCurrentEntry({ ...currentEntry, title: e.target.value })}
                                    placeholder="Ex: Servicii Înhumare"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">Categorie</label>
                                <select
                                    className="w-full rounded-lg border border-border bg-background px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    value={currentEntry.category || 'general'}
                                    onChange={e => setCurrentEntry({ ...currentEntry, category: e.target.value })}
                                >
                                    <option value="general">General</option>
                                    <option value="legal">Legislativ</option>
                                    <option value="pricing">Prețuri</option>
                                    <option value="religious">Religios</option>
                                    <option value="procedures">Proceduri</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">Conținut</label>
                                <textarea
                                    className="min-h-[150px] w-full resize-none rounded-lg border border-border bg-background p-4 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    value={currentEntry.content || ''}
                                    onChange={e => setCurrentEntry({ ...currentEntry, content: e.target.value })}
                                    placeholder="Detaliile complete..."
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setCurrentEntry(curr => ({ ...curr, is_active: !curr.is_active }))}
                                    className={`relative h-6 w-11 rounded-full transition-colors ${currentEntry.is_active ? 'bg-primary' : 'bg-gray-300'}`}
                                >
                                    <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${currentEntry.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                                </button>
                                <span className="text-sm font-medium">Activ</span>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end gap-3">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="rounded-lg px-4 py-2 text-sm font-medium hover:bg-secondary"
                                disabled={saving}
                            >
                                Anulează
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                                disabled={saving}
                            >
                                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                                Salvează
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- Subcomponents ---

function KnowledgeBaseSection({ entries, loading, onCreate, onEdit, onDelete }: {
    entries: KnowledgeEntry[],
    loading: boolean,
    onCreate: () => void,
    onEdit: (e: KnowledgeEntry) => void,
    onDelete: (id: string) => void
}) {
    return (
        <div className="rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border p-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <BookOpen className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold">Baza de Cunoștințe</h2>
                        <p className="text-sm text-muted-foreground">Informații despre serviciile funerare folosite de AI</p>
                    </div>
                </div>
                <button
                    onClick={onCreate}
                    className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                    <Plus className="h-4 w-4" />
                    Adaugă Intrare
                </button>
            </div>

            <div className="p-6">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : entries.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                        <AlertCircle className="mb-4 h-12 w-12 opacity-20" />
                        <p>Nu există intrări în baza de cunoștințe.</p>
                        <button
                            onClick={onCreate}
                            className="mt-4 text-sm font-medium text-primary hover:underline"
                        >
                            Adaugă prima intrare
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {entries.map((entry) => (
                            <div
                                key={entry.id}
                                className="flex items-start justify-between rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/20"
                            >
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`inline-flex h-2 w-2 rounded-full ${entry.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                                        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                                            {entry.category}
                                        </span>
                                        <h3 className="font-semibold">{entry.title}</h3>
                                    </div>
                                    <p className="line-clamp-2 text-sm text-muted-foreground">
                                        {entry.content}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => onEdit(entry)}
                                        className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
                                        title="Editează"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => onDelete(entry.id)}
                                        className="rounded-lg p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                                        title="Șterge"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// Removed local definitions in favor of shared types


function BrandIdentitySection() {
    const [settings, setSettings] = useState<BrandSettings>(DEFAULT_BRAND_SETTINGS);
    const [newForbidden, setNewForbidden] = useState('');
    const [newPreferred, setNewPreferred] = useState('');
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem('brand_settings');
        if (saved) {
            try {
                setSettings(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse settings', e);
            }
        }
    }, []);

    const handleChange = (key: keyof BrandSettings, value: any) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const handleSave = () => {
        localStorage.setItem('brand_settings', JSON.stringify(settings));
        setHasChanges(false);
        toast.success('Configurări de brand salvate!');
    };

    const addToList = (listKey: 'forbiddenWords' | 'preferredPhrases', value: string, resetFn: (s: string) => void) => {
        if (!value.trim()) return;
        setSettings(prev => ({
            ...prev,
            [listKey]: [...prev[listKey], value.trim()]
        }));
        resetFn('');
        setHasChanges(true);
    };

    const removeFromList = (listKey: 'forbiddenWords' | 'preferredPhrases', index: number) => {
        setSettings(prev => ({
            ...prev,
            [listKey]: prev[listKey].filter((_, i) => i !== index)
        }));
        setHasChanges(true);
    };

    return (
        <div className="space-y-6">
            {/* Identity Card */}
            <div className="rounded-2xl border border-border bg-card p-6">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">Identitate Brand</h2>
                        <p className="text-sm text-muted-foreground">Informații de bază despre companie</p>
                    </div>
                    {hasChanges && (
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                        >
                            <CheckCircle2 className="h-4 w-4" />
                            Salvează
                        </button>
                    )}
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="mb-2 block text-sm font-medium">Nume Companie</label>
                        <input
                            type="text"
                            value={settings.companyName}
                            onChange={(e) => handleChange('companyName', e.target.value)}
                            className="w-full rounded-lg border border-border bg-background px-4 py-2 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium">Descriere scurtă</label>
                        <textarea
                            value={settings.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            className="h-24 w-full resize-none rounded-lg border border-border bg-background p-4 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                </div>
            </div>

            {/* Tone Sliders */}
            <div className="rounded-2xl border border-border bg-card p-6">
                <div className="mb-6">
                    <h2 className="text-lg font-semibold">Ajustare Ton</h2>
                    <p className="text-sm text-muted-foreground">Ajustează balanța tonului pentru conținutul generat</p>
                </div>

                <div className="space-y-8">
                    <SliderControl
                        label="Formal ← → Informal"
                        value={settings.toneBalance}
                        onChange={(v) => handleChange('toneBalance', v)}
                        leftLabel="Foarte formal"
                        centerLabel="Natural"
                        rightLabel="Casual"
                    />
                    <SliderControl
                        label="Nivel Emoțional"
                        value={settings.emotionalLevel}
                        onChange={(v) => handleChange('emotionalLevel', v)}
                        leftLabel="Neutru"
                        centerLabel="Empatic"
                        rightLabel="Intens"
                    />
                    <SliderControl
                        label="Referințe Religioase"
                        value={settings.religiousLevel}
                        onChange={(v) => handleChange('religiousLevel', v)}
                        leftLabel="Absent"
                        centerLabel="Subtil"
                        rightLabel="Pronunțat"
                    />
                </div>
            </div>

            {/* Constraints */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Forbidden Words */}
                <div className="rounded-2xl border border-border bg-card p-6">
                    <div className="mb-4">
                        <h3 className="font-semibold text-red-500">Cuvinte Interzise</h3>
                        <p className="text-xs text-muted-foreground">AI-ul va evita aceste expresii</p>
                    </div>
                    <div className="mb-4 flex gap-2">
                        <input
                            type="text"
                            value={newForbidden}
                            onChange={(e) => setNewForbidden(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addToList('forbiddenWords', newForbidden, setNewForbidden)}
                            placeholder="Adaugă cuvânt..."
                            className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                        />
                        <button
                            onClick={() => addToList('forbiddenWords', newForbidden, setNewForbidden)}
                            className="rounded-lg bg-secondary px-3 py-1.5 text-sm font-medium hover:bg-secondary/80"
                        >
                            +
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {settings.forbiddenWords.map((word, i) => (
                            <span key={i} className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 dark:bg-red-900/20 dark:text-red-400">
                                {word}
                                <button onClick={() => removeFromList('forbiddenWords', i)} className="hover:text-red-900">×</button>
                            </span>
                        ))}
                        {settings.forbiddenWords.length === 0 && (
                            <span className="text-xs italic text-muted-foreground">Niciun cuvânt interzis</span>
                        )}
                    </div>
                </div>

                {/* Preferred Phrases */}
                <div className="rounded-2xl border border-border bg-card p-6">
                    <div className="mb-4">
                        <h3 className="font-semibold text-green-600">Expresii Preferate</h3>
                        <p className="text-xs text-muted-foreground">AI-ul va încerca să le folosească</p>
                    </div>
                    <div className="mb-4 flex gap-2">
                        <input
                            type="text"
                            value={newPreferred}
                            onChange={(e) => setNewPreferred(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addToList('preferredPhrases', newPreferred, setNewPreferred)}
                            placeholder="Adaugă expresie..."
                            className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
                        />
                        <button
                            onClick={() => addToList('preferredPhrases', newPreferred, setNewPreferred)}
                            className="rounded-lg bg-secondary px-3 py-1.5 text-sm font-medium hover:bg-secondary/80"
                        >
                            +
                        </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {settings.preferredPhrases.map((phrase, i) => (
                            <span key={i} className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
                                {phrase}
                                <button onClick={() => removeFromList('preferredPhrases', i)} className="hover:text-green-900">×</button>
                            </span>
                        ))}
                        {settings.preferredPhrases.length === 0 && (
                            <span className="text-xs italic text-muted-foreground">Nu ai adăugat expresii preferate</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function SliderControl({ label, value, onChange, leftLabel, centerLabel, rightLabel }: {
    label: string,
    value: number,
    onChange: (val: number) => void,
    leftLabel: string,
    centerLabel: string,
    rightLabel: string
}) {
    return (
        <div>
            <div className="mb-2 flex items-center justify-between">
                <label className="font-medium">{label}</label>
                <span className="rounded-md bg-secondary px-2 py-0.5 text-sm font-bold text-foreground">
                    {value}/10
                </span>
            </div>
            <input
                type="range"
                min="0"
                max="10"
                step="1"
                value={value}
                onChange={(e) => onChange(parseInt(e.target.value))}
                className="h-2 w-full appearance-none rounded-full bg-secondary accent-primary outline-none"
            />
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                <span>{leftLabel}</span>
                <span>{centerLabel}</span>
                <span>{rightLabel}</span>
            </div>
        </div>
    );
}
