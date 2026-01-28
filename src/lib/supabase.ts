import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Type definitions for database tables
export interface KnowledgeEntry {
    id: string;
    category: 'company' | 'service' | 'tradition' | 'value' | 'contact' | 'product';
    title: string;
    content: string;
    keywords: string[];
    is_active: boolean;
    priority: number;
    created_at: string;
    updated_at: string;
}

export interface PostHistory {
    id: string;
    platform: 'facebook' | 'instagram' | 'tiktok';
    post_type: 'informative' | 'service' | 'community' | 'seasonal' | 'supportive';
    tone: 'formal' | 'cald' | 'compasionat';
    variant_type?: 'safe' | 'creative' | 'emotional';
    content: string;
    hashtags: string[];
    custom_prompt?: string;
    tip?: string;
    engagement_predicted?: number;
    engagement_actual?: number;
    user_rating?: number;
    was_used: boolean;
    was_edited: boolean;
    edited_content?: string;
    is_favorite: boolean;
    posted_at?: string;
    generated_at: string;
}

export interface CalendarEvent {
    id: string;
    name: string;
    name_ro: string;
    date?: string;
    is_floating: boolean;
    calculation_rule?: string;
    importance: number;
    type: 'religious' | 'memorial' | 'national' | 'seasonal';
    content_themes: string[];
    tone_recommendation?: string;
    avoid_sales: boolean;
    content_suggestions?: Record<string, unknown>;
    pre_event_days: number;
    created_at: string;
}

export interface BrandVoice {
    id: string;
    attribute: string;
    value: string;
    examples: string[];
    avoid: string[];
    context?: string;
    is_active: boolean;
    updated_at: string;
}

export interface ContentPattern {
    id: string;
    pattern_type: 'hook' | 'cta' | 'structure' | 'phrase' | 'hashtag_combo';
    pattern: string;
    success_score?: number;
    platform?: 'facebook' | 'instagram' | 'tiktok' | 'all';
    post_type?: 'informative' | 'service' | 'community' | 'seasonal' | 'supportive' | 'all';
    usage_count: number;
    last_used?: string;
    is_active: boolean;
    created_at: string;
}
