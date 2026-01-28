'use server';

import { brain } from '@/lib/brain';
import type { Platform, PostType, Tone, GeneratedPost, WordCount } from '@/lib/brain';

interface GenerateParams {
    platform: Platform;
    postType: PostType;
    tone: Tone;
    customPrompt?: string;
    wordCount?: WordCount;
    mediaBase64?: string;
    mediaMimeType?: string;
}

interface GenerateResult {
    success: boolean;
    data?: {
        content: string;
        hashtags: string[];
        tip: string;
    };
    // New: multiple variants
    variants?: GeneratedPost[];
    error?: string;
}

/**
 * Generate content using the full multi-agent brain pipeline.
 * Returns 3 variants (safe, creative, emotional).
 * If media is provided, it will be analyzed by Gemini Vision.
 */
export async function generatePost(params: GenerateParams): Promise<GenerateResult> {
    try {
        console.log('[Actions] Starting brain generation...', {
            ...params,
            mediaBase64: params.mediaBase64 ? '[BASE64_DATA]' : undefined,
        });

        const result = await brain.generate({
            platform: params.platform,
            postType: params.postType,
            tone: params.tone,
            customPrompt: params.customPrompt,
            wordCount: params.wordCount,
            mediaBase64: params.mediaBase64,
            mediaMimeType: params.mediaMimeType,
        });

        if (!result.success || result.posts.length === 0) {
            return {
                success: false,
                error: result.error || 'Nu am putut genera conținutul',
            };
        }

        // Return the first/best variant for backward compatibility
        // Plus all variants for the new UI
        const bestPost = result.posts[0];

        return {
            success: true,
            data: {
                content: bestPost.variant.content,
                hashtags: bestPost.hashtags,
                tip: bestPost.tip,
            },
            variants: result.posts,
        };
    } catch (error) {
        console.error('[Actions] Generation error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Eroare la generarea conținutului',
        };
    }
}

/**
 * Quick generation - faster but less sophisticated.
 * Uses only Writer and Optimizer agents.
 */
export async function quickGeneratePost(params: GenerateParams): Promise<GenerateResult> {
    try {
        const result = await brain.quickGenerate({
            platform: params.platform,
            postType: params.postType,
            tone: params.tone,
            customPrompt: params.customPrompt,
        });

        if (!result.success || result.posts.length === 0) {
            return {
                success: false,
                error: result.error || 'Nu am putut genera conținutul',
            };
        }

        const bestPost = result.posts[0];

        return {
            success: true,
            data: {
                content: bestPost.variant.content,
                hashtags: bestPost.hashtags,
                tip: bestPost.tip,
            },
            variants: result.posts,
        };
    } catch (error) {
        console.error('[Actions] Quick generation error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Eroare la generarea conținutului',
        };
    }
}

/**
 * Rate a generated post and trigger learning.
 */
export async function ratePost(postId: string, rating: number): Promise<{ success: boolean; error?: string }> {
    try {
        const { learnFromFeedback } = await import('@/lib/brain/intelligence');
        await learnFromFeedback(postId, rating, false);
        return { success: true };
    } catch (error) {
        console.error('[Actions] Rate error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Eroare la salvare'
        };
    }
}

/**
 * Mark post as used (was published).
 */
export async function markPostUsed(postId: string, editedContent?: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { markPostAsUsed } = await import('@/lib/data');
        await markPostAsUsed(postId, editedContent);

        // Also trigger learning for used posts (implicit 4-star rating)
        const { learnFromFeedback } = await import('@/lib/brain/intelligence');
        await learnFromFeedback(postId, 4, true);

        return { success: true };
    } catch (error) {
        console.error('[Actions] Mark used error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Eroare la salvare'
        };
    }
}

/**
 * Toggle favorite status of a post.
 */
export async function togglePostFavorite(postId: string, isFavorite: boolean): Promise<{ success: boolean; error?: string }> {
    try {
        const { toggleFavorite } = await import('@/lib/data');
        await toggleFavorite(postId, isFavorite);
        return { success: true };
    } catch (error) {
        console.error('[Actions] Toggle favorite error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Eroare la salvare'
        };
    }
}

/**
 * Get post history.
 */
export async function fetchPostHistory(limit: number = 20) {
    try {
        const { getPostHistory } = await import('@/lib/data');
        const posts = await getPostHistory(limit);
        return { success: true, posts };
    } catch (error) {
        console.error('[Actions] Fetch history error:', error);
        return {
            success: false,
            posts: [],
            error: error instanceof Error ? error.message : 'Eroare la încărcare'
        };
    }
}

