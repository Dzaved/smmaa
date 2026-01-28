'use client';

import { PostType } from '@/lib/gemini';

interface PostTypeSelectorProps {
    selected: PostType;
    onChange: (postType: PostType) => void;
}

const postTypes: { id: PostType; label: string; icon: string; hint: string }[] = [
    {
        id: 'informative',
        label: 'Educațional',
        icon: '📚',
        hint: 'Sfaturi, tradiții, informații utile'
    },
    {
        id: 'service',
        label: 'Servicii',
        icon: '⭐',
        hint: 'Prezentarea serviciilor oferite'
    },
    {
        id: 'community',
        label: 'Comunitate',
        icon: '🤝',
        hint: 'Echipă, experiență, încredere'
    },
    {
        id: 'seasonal',
        label: 'Sezonier',
        icon: '🕯️',
        hint: 'Sărbători, comemorări, momente speciale'
    },
    {
        id: 'supportive',
        label: 'Sprijin',
        icon: '💙',
        hint: 'Citate, mesaje de confort'
    },
];

export default function PostTypeSelector({ selected, onChange }: PostTypeSelectorProps) {
    return (
        <div className="post-type-grid">
            {postTypes.map((type) => (
                <button
                    key={type.id}
                    type="button"
                    className={`post-type-card ${selected === type.id ? 'active' : ''}`}
                    onClick={() => onChange(type.id)}
                >
                    <div className="post-type-icon">{type.icon}</div>
                    <div className="post-type-label">{type.label}</div>
                    <div className="post-type-hint">{type.hint}</div>
                </button>
            ))}
        </div>
    );
}
