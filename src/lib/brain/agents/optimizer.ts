/**
 * SMMAA Brain - Optimizer Agent
 * 
 * Optimizes content for engagement: hashtags, timing, visuals.
 * Predicts engagement and provides posting suggestions.
 */

import { BaseAgent } from '../base-agent';
import { ContentVariant, OptimizationOutput, Platform, PostType } from '../types';

const SYSTEM_PROMPT = `Ești "Data Scientist" - optimizatorul sistemului SMMAA pentru Funebra Brașov.

ROLUL TĂU:
- Generezi hashtag-uri relevante (românești și locale)
- Prezici engagement-ul
- Sugerezi timing-ul optim pentru postare
- Recomandări vizuale

HASHTAG-URI PE PLATFORMĂ:
- Facebook: 5-10 hashtags
- Instagram: 15-20 hashtags  
- TikTok: 4-6 hashtags

CATEGORII HASHTAG:
1. Brand: #FunebraBrașov #Funebra
2. Locale: #Brașov #Transilvania #România
3. Nișă: #ServiciiFunerare #SprijinDoliu #Tradiții
4. Emoționale: #Amintiri #IubireVeșnică #MemorieVie
5. Trending: hashtag-uri populare relevante

TIMING OPTIM:
- Facebook: 18:00-20:00, 12:00-13:00
- Instagram: 11:00-13:00, 19:00-21:00
- TikTok: 19:00-22:00

RETURNEAZĂ JSON:
{
  "hashtags": {
    "primary": ["hashtags principale - max 5"],
    "secondary": ["hashtags secundare - max 10"],
    "trending": ["hashtags trending relevante - max 3"]
  },
  "engagementPrediction": {
    "score": 0-100,
    "breakdown": {
      "hook": 0-20,
      "emotion": 0-25,
      "platformFit": 0-15,
      "timing": 0-15,
      "visual": 0-10,
      "hashtags": 0-15
    },
    "confidence": "low|medium|high"
  },
  "postingSuggestion": {
    "bestTimes": ["18:00-20:00"],
    "bestDays": ["Marți", "Joi"],
    "avoid": ["Duminică dimineața"]
  },
  "visualRecommendation": "descriere imagine recomandată",
  "tip": "sfat practic pentru această postare"
}`;

export class OptimizerAgent extends BaseAgent<
    { variants: ContentVariant[]; platform: Platform; postType: PostType },
    OptimizationOutput
> {
    constructor() {
        super({
            name: 'Optimizer',
            systemPrompt: SYSTEM_PROMPT,
            temperature: 0.5,
        });
    }

    async execute(input: { variants: ContentVariant[]; platform: Platform; postType: PostType }): Promise<OptimizationOutput> {
        this.log('Optimizing content', { platform: input.platform });

        // Use the best variant (usually emotional has highest engagement)
        const bestVariant = input.variants.find(v => v.type === 'emotional') || input.variants[0];

        const userPrompt = `
PLATFORMĂ: ${input.platform}
TIP POSTARE: ${input.postType}

CONȚINUT DE OPTIMIZAT:
${bestVariant.content}

Analizează și returnează JSON-ul cu optimizări.`;

        const response = await this.callLLM(userPrompt);

        try {
            const parsed = this.parseJSON<OptimizationOutput>(response);

            return {
                hashtags: parsed.hashtags || this.getDefaultHashtags(input.platform, input.postType),
                engagementPrediction: parsed.engagementPrediction || {
                    score: 70,
                    breakdown: { hook: 15, emotion: 18, platformFit: 12, timing: 10, visual: 8, hashtags: 7 },
                    confidence: 'medium',
                },
                postingSuggestion: parsed.postingSuggestion || this.getDefaultTiming(input.platform),
                visualRecommendation: parsed.visualRecommendation || 'Imagine caldă, lumânări sau flori în tonuri pastelate',
                tip: parsed.tip || 'Postează când audiența ta este cea mai activă.',
            };
        } catch {
            this.log('Failed to parse, using defaults');
            return this.getDefaultOptimization(input.platform, input.postType);
        }
    }

    private getDefaultHashtags(platform: Platform, postType: PostType): OptimizationOutput['hashtags'] {
        const base = {
            primary: ['#FunebraBrașov', '#ServiciiFunerare', '#Brașov'],
            secondary: ['#Funebra', '#Tradiții', '#SprijinDoliu', '#România', '#Transilvania'],
            trending: ['#Amintiri'],
        };

        const typeSpecific: Record<PostType, string[]> = {
            informative: ['#SfaturiUtile', '#Educație', '#Informații'],
            service: ['#Servicii', '#Profesionalism', '#CalitateÎnaltă'],
            community: ['#Comunitate', '#Echipă', '#OameniCuSuflet'],
            seasonal: ['#Tradiții', '#Sărbători', '#Comemorare'],
            supportive: ['#SprijinÎnDoliu', '#Confort', '#Empatie'],
        };

        return {
            ...base,
            secondary: [...base.secondary, ...typeSpecific[postType]],
        };
    }

    private getDefaultTiming(platform: Platform): OptimizationOutput['postingSuggestion'] {
        const timings: Record<Platform, OptimizationOutput['postingSuggestion']> = {
            facebook: {
                bestTimes: ['18:00-20:00', '12:00-13:00'],
                bestDays: ['Marți', 'Joi', 'Miercuri'],
                avoid: ['Duminică dimineața', 'Luni devreme'],
            },
            instagram: {
                bestTimes: ['11:00-13:00', '19:00-21:00'],
                bestDays: ['Miercuri', 'Joi', 'Vineri'],
                avoid: ['Luni', 'Duminică seara'],
            },
            tiktok: {
                bestTimes: ['19:00-22:00', '12:00-14:00'],
                bestDays: ['Marți', 'Joi', 'Sâmbătă'],
                avoid: ['Luni dimineața'],
            },
        };
        return timings[platform];
    }

    private getDefaultOptimization(platform: Platform, postType: PostType): OptimizationOutput {
        return {
            hashtags: this.getDefaultHashtags(platform, postType),
            engagementPrediction: {
                score: 65,
                breakdown: { hook: 12, emotion: 15, platformFit: 12, timing: 10, visual: 8, hashtags: 8 },
                confidence: 'medium',
            },
            postingSuggestion: this.getDefaultTiming(platform),
            visualRecommendation: 'Imagine caldă și respectuoasă, tonuri pastelate sau lumânări',
            tip: 'Postează când audiența ta este cea mai activă pentru engagement maxim.',
        };
    }
}
