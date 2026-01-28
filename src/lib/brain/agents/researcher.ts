/**
 * SMMAA Brain - Researcher Agent
 * 
 * Gathers context from knowledge base, calendar, and post history.
 * First agent in the pipeline - provides foundation for all others.
 */

import { BaseAgent } from '../base-agent';
import { GenerationRequest, ResearcherOutput } from '../types';
import { getKnowledgeContext, getCalendarContext, getBrandVoiceContext, getPostHistory } from '../../data';

const SYSTEM_PROMPT = `Ești "Bibliotecarul" - agentul de cercetare al sistemului SMMAA pentru Funebra Brașov.

ROLUL TĂU:
- Analizezi contextul furnizat (informații companie, calendar, istoric postări)
- Identifici informații relevante pentru cererea de conținut
- Semnalezi oportunități sau avertismente
- NU scrii conținut, doar pregătești informațiile

IEȘIRE:
Returnează un JSON cu structura:
{
  "relevantServices": ["lista serviciilor relevante pentru acest tip de postare"],
  "upcomingOpportunities": ["evenimente sau ocazii relevante"],
  "warnings": ["avertismente - ex: postare similară recentă, eveniment sensibil"],
  "keyFacts": ["fapte cheie de menționat"],
  "suggestedAngle": "un unghi/perspectivă unică pentru această postare"
}`;

export class ResearcherAgent extends BaseAgent<GenerationRequest & { contexts: { knowledge: string; calendar: string; brandVoice: string; recentPosts: string[] } }, ResearcherOutput> {
    constructor() {
        super({
            name: 'Researcher',
            systemPrompt: SYSTEM_PROMPT,
            temperature: 0.2, // Low temperature for factual analysis
        });
    }

    async execute(input: GenerationRequest & { contexts: { knowledge: string; calendar: string; brandVoice: string; recentPosts: string[] } }): Promise<ResearcherOutput> {
        this.log('Starting research', { platform: input.platform, postType: input.postType });

        const userPrompt = `
CERERE DE CONȚINUT:
- Platformă: ${input.platform}
- Tip postare: ${input.postType}
- Ton: ${input.tone}
- Instrucțiuni suplimentare: ${input.customPrompt || 'Niciuna'}

CONTEXT COMPANIE:
${input.contexts.knowledge}

CALENDAR EVENIMENTE:
${input.contexts.calendar}

GHID VOCE BRAND:
${input.contexts.brandVoice}

POSTĂRI RECENTE (ultimele 30 zile):
${input.contexts.recentPosts.slice(0, 5).join('\n---\n') || 'Nicio postare recentă'}

Analizează și returnează JSON-ul cu informațiile relevante.`;

        const response = await this.callLLM(userPrompt);

        try {
            const parsed = this.parseJSON<{
                relevantServices: string[];
                upcomingOpportunities: string[];
                warnings: string[];
                keyFacts: string[];
                suggestedAngle: string;
            }>(response);

            return {
                companyInfo: input.contexts.knowledge,
                relevantServices: parsed.relevantServices || [],
                upcomingEvents: [], // Will be populated from calendar
                recentPosts: input.contexts.recentPosts,
                knowledgeContext: input.contexts.knowledge,
                calendarContext: input.contexts.calendar,
                brandVoiceContext: input.contexts.brandVoice,
                warnings: parsed.warnings || [],
            };
        } catch {
            // Fallback if parsing fails
            this.log('Failed to parse response, using fallback');
            return {
                companyInfo: input.contexts.knowledge,
                relevantServices: [],
                upcomingEvents: [],
                recentPosts: input.contexts.recentPosts,
                knowledgeContext: input.contexts.knowledge,
                calendarContext: input.contexts.calendar,
                brandVoiceContext: input.contexts.brandVoice,
                warnings: [],
            };
        }
    }
}

/**
 * Helper function to gather all contexts
 */
export async function gatherContexts(): Promise<{
    knowledge: string;
    calendar: string;
    brandVoice: string;
    recentPosts: string[];
}> {
    const [knowledge, calendar, brandVoice, history] = await Promise.all([
        getKnowledgeContext(),
        getCalendarContext(),
        getBrandVoiceContext(),
        getPostHistory(10),
    ]);

    return {
        knowledge,
        calendar,
        brandVoice,
        recentPosts: history.map(p => p.content),
    };
}
