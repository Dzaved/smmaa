'use server';

import { supabase, KnowledgeEntry, CalendarEvent, BrandVoice } from './supabase';

/**
 * Get all knowledge entries for a category
 */
export async function getKnowledge(category?: string): Promise<KnowledgeEntry[]> {
    let query = supabase
        .from('knowledge_base')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: false });

    if (category) {
        query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
}

/**
 * Get all knowledge entries as context string for AI
 */
export async function getKnowledgeContext(): Promise<string> {
    const entries = await getKnowledge();

    const grouped: Record<string, KnowledgeEntry[]> = {};
    entries.forEach(entry => {
        if (!grouped[entry.category]) {
            grouped[entry.category] = [];
        }
        grouped[entry.category].push(entry);
    });

    let context = '=== INFORMAȚII FUNEBRA BRAȘOV ===\n\n';

    for (const [category, items] of Object.entries(grouped)) {
        context += `## ${category.toUpperCase()}\n`;
        items.forEach(item => {
            context += `### ${item.title}\n${item.content}\n\n`;
        });
    }

    return context;
}

/**
 * Get upcoming calendar events (next N days)
 */
export async function getUpcomingEvents(daysAhead: number = 14): Promise<CalendarEvent[]> {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + daysAhead);

    const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .gte('date', today.toISOString().split('T')[0])
        .lte('date', futureDate.toISOString().split('T')[0])
        .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
}

/**
 * Get calendar context for AI
 */
export async function getCalendarContext(): Promise<string> {
    const events = await getUpcomingEvents(14);

    if (events.length === 0) {
        return 'Nu sunt evenimente speciale în următoarele 2 săptămâni.';
    }

    let context = '=== EVENIMENTE APROPIATE ===\n\n';
    events.forEach(event => {
        const date = new Date(event.date || '').toLocaleDateString('ro-RO', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        context += `📅 ${event.name_ro} (${date})\n`;
        context += `   Importanță: ${'⭐'.repeat(event.importance)}\n`;
        context += `   Temă: ${event.content_themes.join(', ')}\n`;
        if (event.tone_recommendation) {
            context += `   Ton recomandat: ${event.tone_recommendation}\n`;
        }
        if (event.avoid_sales) {
            context += `   ⚠️ Evită mesajele comerciale\n`;
        }
        context += '\n';
    });

    return context;
}

/**
 * Get brand voice guidelines
 */
export async function getBrandVoice(): Promise<BrandVoice[]> {
    const { data, error } = await supabase
        .from('brand_voice')
        .select('*')
        .eq('is_active', true);

    if (error) throw error;
    return data || [];
}

/**
 * Get brand voice context for AI
 */
export async function getBrandVoiceContext(): Promise<string> {
    const guidelines = await getBrandVoice();

    let context = '=== GHID VOCE BRAND ===\n\n';
    guidelines.forEach(g => {
        context += `**${g.attribute}**: ${g.value}\n`;
        if (g.examples.length > 0) {
            context += `  Exemple: ${g.examples.join(', ')}\n`;
        }
        if (g.avoid.length > 0) {
            context += `  ❌ Evită: ${g.avoid.join(', ')}\n`;
        }
        context += '\n';
    });

    return context;
}

/**
 * Get complete context for AI content generation
 */
export async function getFullContext(): Promise<string> {
    const [knowledge, calendar, brandVoice] = await Promise.all([
        getKnowledgeContext(),
        getCalendarContext(),
        getBrandVoiceContext()
    ]);

    return `${knowledge}\n${calendar}\n${brandVoice}`;
}

/**
 * Check for similar recent posts
 */
export async function findSimilarPosts(content: string, daysBack: number = 30): Promise<boolean> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const { data, error } = await supabase
        .from('post_history')
        .select('id, content')
        .gte('generated_at', cutoffDate.toISOString())
        .limit(50);

    if (error) throw error;

    // Simple similarity check - look for significant overlap
    const contentWords = new Set(content.toLowerCase().split(/\s+/).filter((w: string) => w.length > 4));

    for (const post of data || []) {
        const postWords = new Set(post.content.toLowerCase().split(/\s+/).filter((w: string) => w.length > 4));
        const intersection = [...contentWords].filter((x: string) => postWords.has(x));
        const similarity = intersection.length / Math.max(contentWords.size, postWords.size);

        if (similarity > 0.5) {
            return true; // Similar post found
        }
    }

    return false;
}

/**
 * Save generated post to history and return the ID
 */
export async function savePost(post: {
    platform: string;
    post_type: string;
    tone: string;
    variant_type?: string;
    content: string;
    hashtags: string[];
    custom_prompt?: string;
    tip?: string;
    engagement_predicted?: number;
    // New media fields
    media_base64?: string;
    media_mime_type?: string;
}): Promise<string | null> {
    // For now, we will store the base64 as a data URL in the media_url column
    // In production, this should upload to Storage and save the returned URL.
    let media_url = null;
    if (post.media_base64 && post.media_mime_type) {
        media_url = `data:${post.media_mime_type};base64,${post.media_base64}`;
    }

    // Exclude the raw base64 from the DB insert payload
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { media_base64, media_mime_type, ...postData } = post;

    const { data, error } = await supabase
        .from('post_history')
        .insert({
            ...postData,
            media_url, // Add this new column
            was_used: false,
            was_edited: false,
            is_favorite: false,
            generated_at: new Date().toISOString()
        })
        .select('id')
        .single();

    if (error) {
        console.error('Failed to save post:', error);
        return null;
    }
    return data?.id || null;
}

/**
 * Rate a post (for learning)
 */
export async function ratePost(postId: string, rating: number) {
    const { error } = await supabase
        .from('post_history')
        .update({ user_rating: rating })
        .eq('id', postId);

    if (error) throw error;
}

/**
 * Mark post as used
 */
export async function markPostAsUsed(postId: string, editedContent?: string) {
    const update: Record<string, unknown> = {
        was_used: true,
        posted_at: new Date().toISOString()
    };

    if (editedContent) {
        update.was_edited = true;
        update.edited_content = editedContent;
    }

    const { error } = await supabase
        .from('post_history')
        .update(update)
        .eq('id', postId);

    if (error) throw error;
}

/**
 * Toggle favorite
 */
export async function toggleFavorite(postId: string, isFavorite: boolean) {
    const { error } = await supabase
        .from('post_history')
        .update({ is_favorite: isFavorite })
        .eq('id', postId);

    if (error) throw error;
}

/**
 * Get post history
 */
export async function getPostHistory(limit: number = 20) {
    const { data, error } = await supabase
        .from('post_history')
        .select('*')
        .order('generated_at', { ascending: false })
        .limit(limit);

    if (error) throw error;
    return data || [];
}

/**
 * Get favorite posts
 */
export async function getFavoritePosts() {
    const { data, error } = await supabase
        .from('post_history')
        .select('*')
        .eq('is_favorite', true)
        .order('generated_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Get scheduled posts
 */
export async function getScheduledPosts() {
    const { data, error } = await supabase
        .from('post_history')
        .select('*')
        .not('scheduled_for', 'is', null)
        .order('scheduled_for', { ascending: true });

    if (error) throw error;
    return data || [];
}

/**
 * Schedule a post
 */
export async function updateSchedule(postId: string, date: string) {
    const { error } = await supabase
        .from('post_history')
        .update({ scheduled_for: date })
        .eq('id', postId);

    if (error) throw error;
}
