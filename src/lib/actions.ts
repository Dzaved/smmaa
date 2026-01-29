'use server';

import { brain } from '@/lib/brain';
import type { Platform, PostType, Tone, GeneratedPost, WordCount, BrandSettings } from '@/lib/brain';

interface GenerateParams {
    platform: Platform;
    postType: PostType;
    tone: Tone;
    customPrompt?: string;
    wordCount?: WordCount;
    mediaBase64?: string;
    mediaMimeType?: string;
    brandSettings?: BrandSettings;
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
            brandSettings: params.brandSettings,
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

/**
 * Get calendar events for the calendar view.
 */
export async function fetchCalendarEvents() {
    try {
        const { supabase } = await import('@/lib/supabase');
        const { data, error } = await supabase
            .from('calendar_events')
            .select('*')
            .order('date', { ascending: true });

        if (error) throw error;
        return { success: true, events: data || [] };
    } catch (error) {
        console.error('[Actions] Fetch calendar error:', error);
        return {
            success: false,
            events: [],
            error: error instanceof Error ? error.message : 'Eroare la încărcare'
        };
    }
}

/**
 * Get all knowledge base entries for administration.
 */
export async function fetchKnowledgeBase() {
    try {
        const { supabase } = await import('@/lib/supabase');
        // Fetch all entries, ordered by category and priority
        const { data, error } = await supabase
            .from('knowledge_base')
            .select('*')
            .order('category', { ascending: true })
            .order('priority', { ascending: false });

        if (error) throw error;
        return { success: true, entries: data || [] };
    } catch (error) {
        console.error('[Actions] Fetch knowledge base error:', error);
        return {
            success: false,
            entries: [],
            error: error instanceof Error ? error.message : 'Eroare la încărcare'
        };
    }
}

/**
 * Server Action to manage Knowledge Base entries securely.
 * Uses Service Role Key if available to bypass RLS.
 */
export async function manageKnowledgeBase(
    action: 'insert' | 'update' | 'delete',
    payload: { id?: string; title?: string; content?: string; category?: string; is_active?: boolean }
) {
    try {
        console.log(`[Actions] manageKnowledgeBase called with action: ${action}`);
        // 1. Check Authentication
        const { isAuthenticated } = await import('@/lib/auth');
        const isAuth = await isAuthenticated();
        console.log(`[Actions] Auth check: ${isAuth}`);

        if (!isAuth) {
            console.warn('[Actions] User check failed. Returning unauthorized.');
            return { success: false, error: 'Neautorizat: Te rugăm să te autentifici.' };
        }

        // 2. Initialize Admin Client
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        console.log(`[Actions] Using Service Key: ${!!serviceRoleKey}`);

        const supabaseKey = serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(supabaseUrl, supabaseKey, {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false
            }
        });

        // 3. Perform Operation
        let result;

        if (action === 'delete') {
            console.log(`[Actions] Deleting ID: ${payload.id}`);
            if (!payload.id) throw new Error('ID missing for delete');
            result = await supabase.from('knowledge_base').delete().eq('id', payload.id);
        } else if (action === 'update') {
            console.log(`[Actions] Updating ID: ${payload.id}`);
            if (!payload.id) throw new Error('ID missing for update');
            // Exclude id from update payload to be safe
            const { id, ...updateData } = payload;

            // Explicitly select() to verify row was updated
            result = await supabase.from('knowledge_base').update(updateData).eq('id', id).select();
        } else if (action === 'insert') {
            console.log('[Actions] Inserting new entry');
            result = await supabase.from('knowledge_base').insert(payload).select();
        } else {
            throw new Error('Invalid action');
        }

        if (result.error) {
            console.error('[Actions] Knowledge Base DB Error:', result.error);
            return { success: false, error: result.error.message };
        }

        console.log('[Actions] DB Result Code:', result.status, 'Text:', result.statusText);
        console.log('[Actions] Data Returned:', result.data);

        if (action === 'update' && Array.isArray(result.data) && result.data.length === 0) {
            console.warn('[Actions] WARNING: Update succeeded but 0 rows returned. RLS or ID mismatch?');
            return { success: false, error: 'Update succeeded but no rows changed. Permissions issue?' };
        }

        return { success: true };
    } catch (error) {
        console.error('[Actions] Manage Knowledge Base error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Eroare neașteptată'
        };
    }
}

/**
 * Schedule a post for a specific date
 */
export async function schedulePost(postId: string, date: Date | string) {
    try {
        const { updateSchedule } = await import('@/lib/data');
        const dateStr = date instanceof Date ? date.toISOString() : date;
        await updateSchedule(postId, dateStr);
        return { success: true };
    } catch (error) {
        console.error('[Actions] Schedule post error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Eroare la programare'
        };
    }
}

/**
 * Fetch all scheduled posts
 */
export async function fetchScheduledPosts() {
    try {
        const { getScheduledPosts } = await import('@/lib/data');
        const posts = await getScheduledPosts();
        return { success: true, posts };
    } catch (error) {
        console.error('[Actions] Fetch scheduled posts error:', error);
        return {
            success: false,
            posts: [],
            error: error instanceof Error ? error.message : 'Eroare la încărcare'
        };
    }
}
