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
    protected async callLLM(userPrompt: string, temperature?: number): Promise<string> {
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            generationConfig: {
                temperature: temperature ?? this.temperature,
                maxOutputTokens: this.maxTokens,
            },
        });

        const fullPrompt = `${this.systemPrompt}\n\n---\n\n${userPrompt}`;

        try {
            const result = await model.generateContent(fullPrompt);
            const response = result.response;
            return response.text();
        } catch (error) {
            console.error(`[${this.name}] Error calling LLM:`, error);
            throw error;
        }
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
