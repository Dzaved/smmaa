'use server';

import { generateContent as geminiGenerate, Platform, PostType, Tone } from '@/lib/gemini';

interface GenerateParams {
    platform: Platform;
    postType: PostType;
    tone: Tone;
    customPrompt?: string;
}

interface GenerateResult {
    success: boolean;
    data?: {
        content: string;
        hashtags: string[];
        tip: string;
    };
    error?: string;
}

export async function generatePost(params: GenerateParams): Promise<GenerateResult> {
    try {
        const result = await geminiGenerate(params);
        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('Generation error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Eroare la generarea conținutului'
        };
    }
}
