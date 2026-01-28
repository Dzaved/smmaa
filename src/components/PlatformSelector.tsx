'use client';

import { Platform } from '@/lib/gemini';

interface PlatformSelectorProps {
    selected: Platform;
    onChange: (platform: Platform) => void;
}

const platforms: { id: Platform; label: string; icon: string }[] = [
    { id: 'facebook', label: 'Facebook', icon: '📘' },
    { id: 'instagram', label: 'Instagram', icon: '📸' },
    { id: 'tiktok', label: 'TikTok', icon: '🎵' },
];

export default function PlatformSelector({ selected, onChange }: PlatformSelectorProps) {
    return (
        <div className="flex gap-3">
            {platforms.map((platform) => (
                <button
                    key={platform.id}
                    type="button"
                    className={`platform-pill ${platform.id} ${selected === platform.id ? 'active' : ''}`}
                    onClick={() => onChange(platform.id)}
                >
                    <span>{platform.icon}</span>
                    <span>{platform.label}</span>
                </button>
            ))}
        </div>
    );
}
