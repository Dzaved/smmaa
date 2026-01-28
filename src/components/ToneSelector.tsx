'use client';

import { Tone } from '@/lib/gemini';

interface ToneSelectorProps {
    selected: Tone;
    onChange: (tone: Tone) => void;
}

const tones: { id: Tone; label: string }[] = [
    { id: 'formal', label: 'Formal' },
    { id: 'cald', label: 'Cald' },
    { id: 'compasionat', label: 'Compasionat' },
];

export default function ToneSelector({ selected, onChange }: ToneSelectorProps) {
    return (
        <div className="tone-selector">
            {tones.map((tone) => (
                <button
                    key={tone.id}
                    type="button"
                    className={`tone-option ${selected === tone.id ? 'active' : ''}`}
                    onClick={() => onChange(tone.id)}
                >
                    {tone.label}
                </button>
            ))}
        </div>
    );
}
