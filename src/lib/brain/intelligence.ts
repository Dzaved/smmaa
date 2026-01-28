/**
 * SMMAA Brain - Intelligence Module
 * 
 * Advanced features: RAG, similarity detection, engagement prediction.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '../supabase';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// ==================== SEMANTIC SEARCH (RAG) ====================

/**
 * Generate embeddings for text using Gemini
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    try {
        const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
        const result = await model.embedContent(text);
        return result.embedding.values;
    } catch (error) {
        console.error('Failed to generate embedding:', error);
        throw error;
    }
}

/**
 * Semantic search in knowledge base
 */
export async function semanticSearch(
    query: string,
    matchThreshold: number = 0.7,
    matchCount: number = 5
): Promise<Array<{ id: string; title: string; content: string; similarity: number }>> {
    try {
        const queryEmbedding = await generateEmbedding(query);

        const { data, error } = await supabase.rpc('match_knowledge', {
            query_embedding: queryEmbedding,
            match_threshold: matchThreshold,
            match_count: matchCount,
        });

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error('Semantic search failed:', error);
        // Fallback to keyword search
        return keywordSearch(query, matchCount);
    }
}

/**
 * Fallback keyword search
 */
async function keywordSearch(
    query: string,
    limit: number = 5
): Promise<Array<{ id: string; title: string; content: string; similarity: number }>> {
    const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 3);

    const { data, error } = await supabase
        .from('knowledge_base')
        .select('id, title, content')
        .eq('is_active', true)
        .limit(limit);

    if (error) throw error;

    // Simple keyword matching
    const results = (data || [])
        .map(item => {
            const content = `${item.title} ${item.content}`.toLowerCase();
            const matches = keywords.filter(k => content.includes(k)).length;
            return { ...item, similarity: matches / keywords.length };
        })
        .filter(item => item.similarity > 0)
        .sort((a, b) => b.similarity - a.similarity);

    return results;
}

// ==================== SIMILARITY DETECTION ====================

/**
 * Calculate Jaccard similarity between two texts
 */
function jaccardSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 4));
    const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 4));

    if (words1.size === 0 || words2.size === 0) return 0;

    const intersection = [...words1].filter(w => words2.has(w)).length;
    const union = new Set([...words1, ...words2]).size;

    return intersection / union;
}

/**
 * Calculate cosine similarity for short texts using word frequency
 */
function cosineSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const words2 = text2.toLowerCase().split(/\s+/).filter(w => w.length > 3);

    const allWords = new Set([...words1, ...words2]);
    const vec1: number[] = [];
    const vec2: number[] = [];

    allWords.forEach(word => {
        vec1.push(words1.filter(w => w === word).length);
        vec2.push(words2.filter(w => w === word).length);
    });

    const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
    const mag1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const mag2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));

    if (mag1 === 0 || mag2 === 0) return 0;
    return dotProduct / (mag1 * mag2);
}

/**
 * Check if content is too similar to recent posts
 */
export async function detectSimilarContent(
    newContent: string,
    daysBack: number = 30,
    threshold: number = 0.6
): Promise<{
    isSimilar: boolean;
    similarPosts: Array<{
        id: string;
        content: string;
        similarity: number;
        generatedAt: string;
    }>;
    warning?: string;
}> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const { data, error } = await supabase
        .from('post_history')
        .select('id, content, generated_at')
        .gte('generated_at', cutoffDate.toISOString())
        .order('generated_at', { ascending: false })
        .limit(100);

    if (error) {
        console.error('Failed to fetch post history:', error);
        return { isSimilar: false, similarPosts: [] };
    }

    const similarPosts: Array<{
        id: string;
        content: string;
        similarity: number;
        generatedAt: string;
    }> = [];

    for (const post of data || []) {
        const jaccard = jaccardSimilarity(newContent, post.content);
        const cosine = cosineSimilarity(newContent, post.content);
        const avgSimilarity = (jaccard + cosine) / 2;

        if (avgSimilarity >= threshold) {
            similarPosts.push({
                id: post.id,
                content: post.content.slice(0, 100) + '...',
                similarity: avgSimilarity,
                generatedAt: post.generated_at,
            });
        }
    }

    const isSimilar = similarPosts.length > 0;

    return {
        isSimilar,
        similarPosts: similarPosts.sort((a, b) => b.similarity - a.similarity).slice(0, 3),
        warning: isSimilar
            ? `⚠️ Conținut similar cu ${similarPosts.length} postări din ultimele ${daysBack} zile. Încearcă un unghi diferit.`
            : undefined,
    };
}

// ==================== ENGAGEMENT PREDICTION ====================

interface EngagementFactors {
    hookStrength: number;      // 0-20
    emotionalDepth: number;    // 0-25
    platformFit: number;       // 0-15
    timing: number;            // 0-15
    visualPotential: number;   // 0-10
    hashtagQuality: number;    // 0-15
}

/**
 * Predict engagement score based on multiple factors
 */
export function predictEngagement(
    content: string,
    platform: 'facebook' | 'instagram' | 'tiktok',
    hashtags: string[] = [],
    postTime?: Date
): {
    score: number;
    breakdown: EngagementFactors;
    confidence: 'low' | 'medium' | 'high';
    suggestions: string[];
} {
    const suggestions: string[] = [];

    // Hook strength (first sentence/line)
    const firstLine = content.split(/[.\n]/)[0] || '';
    let hookStrength = 10;

    // Good hooks: questions, emotional words, direct address
    if (firstLine.includes('?')) hookStrength += 5;
    if (/dumneavoastră|vouă|tu/i.test(firstLine)) hookStrength += 3;
    if (/(inima|suflet|amintir|memori|iubire)/i.test(firstLine)) hookStrength += 2;
    if (firstLine.length < 10) {
        hookStrength -= 5;
        suggestions.push('Adaugă un hook mai captivant la început');
    }
    hookStrength = Math.min(20, Math.max(0, hookStrength));

    // Emotional depth
    const emotionalWords = [
        'iubire', 'suflet', 'inimă', 'amintiri', 'memorie', 'veșnicie',
        'dor', 'pace', 'lumină', 'speranță', 'recunoștință', 'compasiune',
        'împreună', 'familie', 'tradiție', 'respect', 'demnitate'
    ];
    const emotionalCount = emotionalWords.filter(w =>
        content.toLowerCase().includes(w)
    ).length;
    let emotionalDepth = Math.min(25, emotionalCount * 4 + 5);

    if (emotionalCount < 2) {
        suggestions.push('Adaugă mai multă emoție și căldură în mesaj');
    }

    // Platform fit
    const wordCount = content.split(/\s+/).length;
    let platformFit = 10;

    const idealLengths = {
        facebook: { min: 100, max: 300 },
        instagram: { min: 50, max: 150 },
        tiktok: { min: 30, max: 80 },
    };

    const ideal = idealLengths[platform];
    if (wordCount >= ideal.min && wordCount <= ideal.max) {
        platformFit = 15;
    } else if (wordCount < ideal.min) {
        platformFit = 8;
        suggestions.push(`Conținutul e prea scurt pentru ${platform}. Adaugă ${ideal.min - wordCount} cuvinte.`);
    } else {
        platformFit = 7;
        suggestions.push(`Conținutul e prea lung pentru ${platform}. Redu cu ${wordCount - ideal.max} cuvinte.`);
    }

    // Timing score
    let timing = 10;
    if (postTime) {
        const hour = postTime.getHours();
        const day = postTime.getDay();

        // Best hours: 12-14, 18-21
        if ((hour >= 12 && hour <= 14) || (hour >= 18 && hour <= 21)) {
            timing = 15;
        } else if (hour >= 6 && hour <= 22) {
            timing = 10;
        } else {
            timing = 5;
            suggestions.push('Evită postarea noaptea (22:00-06:00)');
        }

        // Weekend slightly lower for business content
        if (day === 0 || day === 6) {
            timing -= 2;
        }
    }

    // Visual potential (emoji detection as proxy)
    const emojiCount = (content.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
    let visualPotential = 5;

    if (platform === 'instagram') {
        visualPotential = emojiCount >= 3 ? 10 : emojiCount >= 1 ? 7 : 5;
        if (emojiCount < 2) suggestions.push('Adaugă emoji pentru Instagram');
    } else if (platform === 'facebook') {
        visualPotential = emojiCount >= 2 && emojiCount <= 5 ? 10 : 7;
    } else {
        visualPotential = emojiCount >= 1 && emojiCount <= 3 ? 10 : 6;
    }

    // Hashtag quality
    let hashtagQuality = 5;
    const hashtagCount = hashtags.length;

    const idealHashtags = { facebook: 5, instagram: 15, tiktok: 5 };
    const targetCount = idealHashtags[platform];

    if (hashtagCount >= targetCount * 0.7 && hashtagCount <= targetCount * 1.5) {
        hashtagQuality = 15;
    } else if (hashtagCount > 0) {
        hashtagQuality = 10;
    } else {
        suggestions.push('Adaugă hashtag-uri relevante');
    }

    const breakdown: EngagementFactors = {
        hookStrength,
        emotionalDepth,
        platformFit,
        timing,
        visualPotential,
        hashtagQuality,
    };

    const score = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

    // Confidence based on content length and completeness
    let confidence: 'low' | 'medium' | 'high' = 'medium';
    if (wordCount > 50 && emotionalCount >= 3 && hashtagCount > 3) {
        confidence = 'high';
    } else if (wordCount < 20 || emotionalCount === 0) {
        confidence = 'low';
    }

    return { score, breakdown, confidence, suggestions };
}

// ==================== LEARNING FROM FEEDBACK ====================

/**
 * Update content patterns based on user feedback
 */
export async function learnFromFeedback(
    postId: string,
    rating: number,
    wasUsed: boolean
): Promise<void> {
    try {
        // Get the post
        const { data: post, error } = await supabase
            .from('post_history')
            .select('*')
            .eq('id', postId)
            .single();

        if (error || !post) return;

        // Extract patterns from high-rated posts
        if (rating >= 4 || wasUsed) {
            // Extract hook pattern
            const firstLine = post.content.split(/[.\n]/)[0] || '';
            if (firstLine.length > 10) {
                await supabase.from('content_patterns').upsert({
                    pattern_type: 'hook',
                    pattern: firstLine,
                    success_score: rating / 5,
                    platform: post.platform,
                    post_type: post.post_type,
                    usage_count: 1,
                    last_used: new Date().toISOString(),
                }, { onConflict: 'pattern' });
            }

            // Extract hashtag combo
            if (post.hashtags && post.hashtags.length > 3) {
                const hashtagCombo = post.hashtags.slice(0, 5).join(' ');
                await supabase.from('content_patterns').upsert({
                    pattern_type: 'hashtag_combo',
                    pattern: hashtagCombo,
                    success_score: rating / 5,
                    platform: post.platform,
                    post_type: post.post_type,
                    usage_count: 1,
                    last_used: new Date().toISOString(),
                }, { onConflict: 'pattern' });
            }
        }

        // Update the post with rating
        await supabase
            .from('post_history')
            .update({
                user_rating: rating,
                was_used: wasUsed || post.was_used
            })
            .eq('id', postId);

    } catch (error) {
        console.error('Failed to learn from feedback:', error);
    }
}

/**
 * Get successful patterns for a given platform/type
 */
export async function getSuccessfulPatterns(
    platform: string,
    postType: string,
    patternType: 'hook' | 'cta' | 'hashtag_combo' = 'hook'
): Promise<string[]> {
    const { data, error } = await supabase
        .from('content_patterns')
        .select('pattern')
        .eq('pattern_type', patternType)
        .or(`platform.eq.${platform},platform.eq.all`)
        .or(`post_type.eq.${postType},post_type.eq.all`)
        .gte('success_score', 0.7)
        .order('success_score', { ascending: false })
        .limit(5);

    if (error) return [];
    return (data || []).map(p => p.pattern);
}

// ==================== EXPORT ALL ====================

export const intelligence = {
    generateEmbedding,
    semanticSearch,
    detectSimilarContent,
    predictEngagement,
    learnFromFeedback,
    getSuccessfulPatterns,
};
