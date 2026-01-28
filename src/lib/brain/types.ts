/**
 * SMMAA Brain - Type Definitions
 * 
 * Defines all interfaces for the multi-agent content generation system.
 */

// ==================== INPUT TYPES ====================

export type Platform = 'facebook' | 'instagram' | 'tiktok';
export type PostType = 'informative' | 'service' | 'community' | 'seasonal' | 'supportive';
export type Tone = 'formal' | 'cald' | 'compasionat';
export type VariantType = 'safe' | 'creative' | 'emotional';
export type WordCount = 'short' | 'medium' | 'long';

export interface MediaAnalysisResult {
    description: string;
    objects: string[];
    mood: string;
    colors: string[];
    suggestedThemes: string[];
    isAppropriate: boolean;
    funeralContext?: {
        isFuneralRelated: boolean;
        elements: string[];
        suggestedTone: string;
    };
}

export interface GenerationRequest {
    platform: Platform;
    postType: PostType;
    tone: Tone;
    customPrompt?: string;
    wordCount?: WordCount;
    mediaBase64?: string;
    mediaMimeType?: string;
    mediaAnalysis?: MediaAnalysisResult;
}

// ==================== AGENT OUTPUTS ====================

export interface ResearcherOutput {
    companyInfo: string;
    relevantServices: string[];
    upcomingEvents: Array<{
        name: string;
        date: string;
        importance: number;
        avoidSales: boolean;
    }>;
    recentPosts: string[];
    knowledgeContext: string;
    calendarContext: string;
    brandVoiceContext: string;
    warnings: string[];
}

export interface StrategyOutput {
    objective: string;
    emotionalApproach: string;
    persuasionPrinciple: string;
    contentStructure: string;
    keyMessage: string;
    angle: string;
    serviceMention: 'none' | 'subtle' | 'direct';
    temperatures: {
        safe: number;
        creative: number;
        emotional: number;
    };
    hooks: string[];
    ctas: string[];
}

export interface ContentVariant {
    type: VariantType;
    content: string;
    hook: string;
    body: string;
    cta: string;
    temperatureUsed: number;
}

export interface WriterOutput {
    variants: ContentVariant[];
    metadata: {
        platform: Platform;
        postType: PostType;
        tone: Tone;
        strategy: string;
    };
}

export interface EditIssue {
    type: 'grammar' | 'sensitivity' | 'brand_voice' | 'diacritics' | 'length';
    text: string;
    suggestion: string;
    severity: 'error' | 'warning' | 'info';
}

export interface EditorOutput {
    passed: boolean;
    grammarScore: number;
    sensitivityScore: number;
    brandVoiceScore: number;
    issues: EditIssue[];
    improvedVariants: ContentVariant[];
}

export interface OptimizationOutput {
    hashtags: {
        primary: string[];
        secondary: string[];
        trending: string[];
    };
    engagementPrediction: {
        score: number;
        breakdown: {
            hook: number;
            emotion: number;
            platformFit: number;
            timing: number;
            visual: number;
            hashtags: number;
        };
        confidence: 'low' | 'medium' | 'high';
    };
    postingSuggestion: {
        bestTimes: string[];
        bestDays: string[];
        avoid: string[];
    };
    visualRecommendation: string;
    tip: string;
}

// ==================== FINAL OUTPUT ====================

export interface GeneratedPost {
    id?: string;
    variant: ContentVariant;
    hashtags: string[];
    tip: string;
    engagementScore: number;
    visualSuggestion: string;
    bestPostingTime: string;
}

export interface GenerationResult {
    success: boolean;
    posts: GeneratedPost[];
    metadata: {
        platform: Platform;
        postType: PostType;
        tone: Tone;
        generatedAt: string;
        processingTime: number;
    };
    debug?: {
        researcherOutput?: ResearcherOutput;
        strategyOutput?: StrategyOutput;
        writerOutput?: WriterOutput;
        editorOutput?: EditorOutput;
        optimizationOutput?: OptimizationOutput;
    };
    error?: string;
}

// ==================== AGENT INTERFACES ====================

export interface AgentConfig {
    name: string;
    temperature: number;
    maxTokens?: number;
}

export interface Agent<TInput, TOutput> {
    name: string;
    execute(input: TInput): Promise<TOutput>;
}

// ==================== ORCHESTRATOR ====================

export interface OrchestratorConfig {
    debug?: boolean;
    saveToHistory?: boolean;
}
