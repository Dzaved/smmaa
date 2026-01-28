/**
 * SMMAA Brain - Orchestrator
 * 
 * Coordinates the multi-agent pipeline for content generation.
 * Manages the flow: Research → Strategy → Write → Edit → Optimize → Save
 */

import {
    ResearcherAgent,
    StrategistAgent,
    WriterAgent,
    EditorAgent,
    OptimizerAgent,
    gatherContexts,
} from './agents';

import {
    GenerationRequest,
    GenerationResult,
    GeneratedPost,
    OrchestratorConfig,
} from './types';

import { savePost } from '../data';
import { detectSimilarContent, predictEngagement, getSuccessfulPatterns } from './intelligence';
import { analyzeImage } from './vision';

export class Orchestrator {
    private researcher: ResearcherAgent;
    private strategist: StrategistAgent;
    private writer: WriterAgent;
    private editor: EditorAgent;
    private optimizer: OptimizerAgent;
    private config: OrchestratorConfig;

    constructor(config: OrchestratorConfig = {}) {
        this.config = {
            debug: config.debug ?? false,
            saveToHistory: config.saveToHistory ?? true,
        };

        this.researcher = new ResearcherAgent();
        this.strategist = new StrategistAgent();
        this.writer = new WriterAgent();
        this.editor = new EditorAgent();
        this.optimizer = new OptimizerAgent();
    }

    /**
     * Main entry point - generate content using the full agent pipeline
     */
    async generate(request: GenerationRequest): Promise<GenerationResult> {
        const startTime = Date.now();

        try {
            this.log('Starting generation pipeline', request);

            // Step 0: Vision analysis if media provided
            if (request.mediaBase64 && request.mediaMimeType && !request.mediaAnalysis) {
                this.log('Step 0: Analyzing uploaded media...', {
                    mimeType: request.mediaMimeType,
                    base64Length: request.mediaBase64.length,
                });
                try {
                    request.mediaAnalysis = await analyzeImage(request.mediaBase64, request.mediaMimeType);
                    this.log('✅ Media analysis SUCCESS:', {
                        description: request.mediaAnalysis.description,
                        objects: request.mediaAnalysis.objects,
                        mood: request.mediaAnalysis.mood,
                    });
                } catch (error) {
                    this.log('❌ Media analysis FAILED:', error);
                }
            } else if (request.mediaAnalysis) {
                this.log('Media already analyzed:', request.mediaAnalysis.description);
            } else {
                this.log('No media provided, skipping vision analysis');
            }

            // Step 1: Gather contexts from database
            this.log('Step 1: Gathering contexts...');
            const contexts = await gatherContexts();

            // Step 2: Research phase
            this.log('Step 2: Researcher analyzing context...');
            const researchOutput = await this.researcher.execute({
                ...request,
                contexts,
            });

            // Step 3: Strategy phase
            this.log('Step 3: Strategist planning approach...');
            const strategyOutput = await this.strategist.execute({
                request,
                research: researchOutput,
            });

            // Step 4: Writing phase (creates 3 variants)
            this.log('Step 4: Writer creating variants...');
            const writerOutput = await this.writer.execute({
                request,
                strategy: strategyOutput,
                context: researchOutput.knowledgeContext,
            });

            // Step 5: Editing phase
            this.log('Step 5: Editor reviewing content...');
            const editorOutput = await this.editor.execute({
                variants: writerOutput.variants,
            });

            // Step 6: Optimization phase
            this.log('Step 6: Optimizer enhancing engagement...');
            const optimizationOutput = await this.optimizer.execute({
                variants: editorOutput.improvedVariants,
                platform: request.platform,
                postType: request.postType,
            });

            // Step 7: Intelligence enhancement - real engagement prediction
            this.log('Step 7: Intelligence analyzing engagement...');
            const allHashtags = [
                ...optimizationOutput.hashtags.primary,
                ...optimizationOutput.hashtags.secondary,
                ...optimizationOutput.hashtags.trending,
            ];

            // Build final output with enhanced engagement scores
            const posts: GeneratedPost[] = editorOutput.improvedVariants.map((variant) => {
                // Get real engagement prediction from intelligence module
                const engagementAnalysis = predictEngagement(
                    variant.content,
                    request.platform,
                    allHashtags,
                    new Date()
                );

                return {
                    variant,
                    hashtags: allHashtags,
                    tip: engagementAnalysis.suggestions.length > 0
                        ? engagementAnalysis.suggestions[0]
                        : optimizationOutput.tip,
                    engagementScore: engagementAnalysis.score,
                    visualSuggestion: optimizationOutput.visualRecommendation,
                    bestPostingTime: optimizationOutput.postingSuggestion.bestTimes[0] || '18:00-20:00',
                };
            });

            // Save to history if enabled and get IDs
            if (this.config.saveToHistory) {
                for (let i = 0; i < posts.length; i++) {
                    try {
                        const savedId = await savePost({
                            platform: request.platform,
                            post_type: request.postType,
                            tone: request.tone,
                            variant_type: posts[i].variant.type,
                            content: posts[i].variant.content,
                            hashtags: posts[i].hashtags,
                            custom_prompt: request.customPrompt,
                            tip: posts[i].tip,
                            engagement_predicted: posts[i].engagementScore,
                        });
                        // Assign the ID back to the post so UI can use it
                        if (savedId) {
                            posts[i].id = savedId;
                            this.log(`Post ${i + 1} saved with ID: ${savedId}`);
                        }
                    } catch (error) {
                        this.log('Failed to save post to history', error);
                    }
                }
            }

            const processingTime = Date.now() - startTime;
            this.log(`Pipeline complete in ${processingTime}ms`);

            return {
                success: true,
                posts,
                metadata: {
                    platform: request.platform,
                    postType: request.postType,
                    tone: request.tone,
                    generatedAt: new Date().toISOString(),
                    processingTime,
                },
                debug: this.config.debug ? {
                    researcherOutput: researchOutput,
                    strategyOutput: strategyOutput,
                    writerOutput: writerOutput,
                    editorOutput: editorOutput,
                    optimizationOutput: optimizationOutput,
                } : undefined,
            };

        } catch (error) {
            const processingTime = Date.now() - startTime;
            this.log('Pipeline failed', error);

            return {
                success: false,
                posts: [],
                metadata: {
                    platform: request.platform,
                    postType: request.postType,
                    tone: request.tone,
                    generatedAt: new Date().toISOString(),
                    processingTime,
                },
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Quick generation - skip some agents for faster output
     * Uses only Writer and Optimizer
     */
    async quickGenerate(request: GenerationRequest): Promise<GenerationResult> {
        const startTime = Date.now();

        try {
            this.log('Starting quick generation');

            // Basic context
            const contexts = await gatherContexts();

            // Direct to writer with default strategy
            const writerOutput = await this.writer.execute({
                request,
                strategy: {
                    objective: request.postType,
                    emotionalApproach: 'Cald și empatic',
                    persuasionPrinciple: 'Autoritate',
                    contentStructure: 'hook-story-lesson-close',
                    keyMessage: '',
                    angle: '',
                    serviceMention: 'none',
                    temperatures: { safe: 0.3, creative: 0.8, emotional: 0.7 },
                    hooks: [],
                    ctas: ['Suntem aici pentru dumneavoastră.'],
                },
                context: contexts.knowledge,
            });

            // Quick optimization
            const optimizationOutput = await this.optimizer.execute({
                variants: writerOutput.variants,
                platform: request.platform,
                postType: request.postType,
            });

            const posts: GeneratedPost[] = writerOutput.variants.map((variant) => ({
                variant,
                hashtags: optimizationOutput.hashtags.primary,
                tip: optimizationOutput.tip,
                engagementScore: optimizationOutput.engagementPrediction.score,
                visualSuggestion: optimizationOutput.visualRecommendation,
                bestPostingTime: optimizationOutput.postingSuggestion.bestTimes[0],
            }));

            return {
                success: true,
                posts,
                metadata: {
                    platform: request.platform,
                    postType: request.postType,
                    tone: request.tone,
                    generatedAt: new Date().toISOString(),
                    processingTime: Date.now() - startTime,
                },
            };

        } catch (error) {
            return {
                success: false,
                posts: [],
                metadata: {
                    platform: request.platform,
                    postType: request.postType,
                    tone: request.tone,
                    generatedAt: new Date().toISOString(),
                    processingTime: Date.now() - startTime,
                },
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    private log(message: string, data?: unknown): void {
        if (this.config.debug) {
            console.log(`[Orchestrator] ${message}`, data ? JSON.stringify(data, null, 2) : '');
        } else {
            console.log(`[Orchestrator] ${message}`);
        }
    }
}

// Singleton instance for easy import
export const brain = new Orchestrator({ debug: false, saveToHistory: true });

// Export types
export * from './types';
