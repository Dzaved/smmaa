/**
 * SMMAA Brain - Base Agent Class
 * 
 * Abstract base class that all agents extend.
 * Provides common functionality for AI interactions.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface AgentConfig {
    name: string;
    systemPrompt: string;
    temperature?: number;
    maxTokens?: number;
}

export abstract class BaseAgent<TInput, TOutput> {
    protected name: string;
    protected systemPrompt: string;
    protected temperature: number;
    protected maxTokens: number;

    constructor(config: AgentConfig) {
        this.name = config.name;
        this.systemPrompt = config.systemPrompt;
        this.temperature = config.temperature ?? 0.7;
        this.maxTokens = config.maxTokens ?? 2048;
    }

    /**
     * Execute the agent's task
     */
    abstract execute(input: TInput): Promise<TOutput>;

    /**
     * Call the Gemini API with the given prompt
     */
    /**
     * Call the Gemini API with the given prompt, with retry logic for 429
     */
    // Global lock to prevent concurrent API calls across all agents
    private static lastCallTime = 0;
    private static MIN_DELAY_BETWEEN_CALLS = 4000; // Increased to 4 seconds to prevent 429
    private static globalLock: Promise<void> = Promise.resolve();

    /**
     * Call the Gemini API with the given prompt, with retry logic for 429
     */
    protected async callLLM(userPrompt: string, temperature?: number, retries = 5): Promise<string> {
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            generationConfig: {
                temperature: temperature ?? this.temperature,
                maxOutputTokens: this.maxTokens,
            },
        });

        const fullPrompt = `${this.systemPrompt}\n\n---\n\n${userPrompt}`;
        let attempt = 0;

        while (attempt <= retries) {
            try {
                // SEQUENTIAL THROTTLE: Ensure only one request waits/executes at a time
                await (BaseAgent.globalLock = BaseAgent.globalLock.then(async () => {
                    const timeSinceLastCall = Date.now() - BaseAgent.lastCallTime;
                    if (timeSinceLastCall < BaseAgent.MIN_DELAY_BETWEEN_CALLS) {
                        const waitTime = BaseAgent.MIN_DELAY_BETWEEN_CALLS - timeSinceLastCall;
                        console.log(`[Throttler] Global lock active. Waiting ${waitTime}ms...`);
                        await new Promise(resolve => setTimeout(resolve, waitTime));
                    }
                    // Reserve the slot immediately
                    BaseAgent.lastCallTime = Date.now();
                }));

                const result = await model.generateContent(fullPrompt);
                const response = result.response;
                return response.text();
            } catch (error: any) {
                const isRateLimit = error.message?.includes('429') ||
                    error.status === 429 ||
                    error.message?.includes('429') ||
                    error.message?.includes('Resource exhausted') ||
                    error.message?.includes('Too Many Requests');

                const isOverloaded = error.message?.includes('503') || error.status === 503;

                if ((isRateLimit || isOverloaded) && attempt < retries) {
                    // Aggressive backoff: 2.5s, 5s... (reduced from 5s)
                    const waitTime = Math.pow(2, attempt) * 2500 + Math.random() * 1000;
                    console.warn(`[${this.name}] Rate limited (429/503). Retrying in ${Math.round(waitTime)}ms... (Attempt ${attempt + 1}/${retries})`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    attempt++;
                    continue;
                }

                console.error(`[${this.name}] Error calling LLM (Final):`, error);
                throw error;
            }
        }

        throw new Error(`[${this.name}] Failed after ${retries} retries`);
    }

    /**
     * Parse JSON from LLM response, handling markdown code blocks
     */
    protected parseJSON<T>(text: string): T {
        // Remove markdown code blocks if present
        let cleaned = text.trim();
        if (cleaned.startsWith('```json')) {
            cleaned = cleaned.slice(7);
        } else if (cleaned.startsWith('```')) {
            cleaned = cleaned.slice(3);
        }
        if (cleaned.endsWith('```')) {
            cleaned = cleaned.slice(0, -3);
        }
        cleaned = cleaned.trim();

        try {
            return JSON.parse(cleaned) as T;
        } catch (error) {
            console.error(`[${this.name}] Failed to parse JSON:`, cleaned);
            throw new Error(`Failed to parse agent response as JSON: ${error}`);
        }
    }

    /**
     * Log agent activity
     */
    protected log(message: string, data?: unknown): void {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [${this.name}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
}
