/**
 * SMMAA Brain - Strategist Agent
 * 
 * Plans the content approach using psychology principles.
 * Applies Cialdini's principles and grief psychology.
 */

import { BaseAgent } from '../base-agent';
import { GenerationRequest, ResearcherOutput, StrategyOutput } from '../types';

const SYSTEM_PROMPT = `Ești "Filosoful Marketingului" - strategul sistemului SMMAA pentru Funebra Brașov.

ROLUL TĂU:
- Planifici abordarea pentru conținut bazat pe psihologie
- Aplici principiile lui Cialdini (Reciprocitate, Dovadă Socială, Autoritate, Simpatie, Raritate, Unitate)
- Ții cont de psihologia doliului (stadiile Kübler-Ross)
- NU scrii conținut, doar strategia

PRINCIPII CIALDINI ADAPTATE:
1. RECIPROCITATE - Oferă valoare înainte de a cere ceva
2. DOVADĂ SOCIALĂ - "20+ ani de încredere", "1000+ familii deservite"
3. AUTORITATE - Expertiză, tradiții, cunoștințe
4. SIMPATIE - Arată echipa, valori comune, autenticitate
5. RARITATE - FOLOSEȘTE CU GRIJĂ - doar pentru evenimente limitate
6. UNITATE - Identitate românească, comunitate, tradiții comune

STADII DOLIU:
- Negare → Informații blânde, prezență
- Furie → Validare, fără judecată
- Negociere → Suport, prezent
- Depresie → Confort, liniște
- Acceptare → Celebrare memorie, speranță

RETURNEAZĂ JSON:
{
  "objective": "educational|supportive|community|service|seasonal",
  "emotionalApproach": "descriere abordare emoțională",
  "persuasionPrinciple": "principiul Cialdini principal",
  "contentStructure": "hook-story-lesson-close | question-answer-insight-invite | statement-evidence-comfort-open",
  "keyMessage": "mesajul cheie în 1-2 propoziții",
  "angle": "unghiul unic/perspectiva pentru această postare",
  "serviceMention": "none|subtle|direct",
  "temperatures": {
    "safe": 0.3,
    "creative": 0.8,
    "emotional": 0.7
  },
  "hooks": ["3 opțiuni de hook"],
  "ctas": ["3 opțiuni de CTA soft"]
}`;

export class StrategistAgent extends BaseAgent<
    { request: GenerationRequest; research: ResearcherOutput },
    StrategyOutput
> {
    constructor() {
        super({
            name: 'Strategist',
            systemPrompt: SYSTEM_PROMPT,
            temperature: 0.4,
        });
    }

    async execute(input: { request: GenerationRequest; research: ResearcherOutput }): Promise<StrategyOutput> {
        this.log('Planning strategy', { postType: input.request.postType, tone: input.request.tone });

        const userPrompt = `
CERERE:
- Platformă: ${input.request.platform}
- Tip postare: ${input.request.postType}
- Ton: ${input.request.tone}
- Instrucțiuni: ${input.request.customPrompt || 'Standard'}

CONTEXT DIN CERCETARE:
- Servicii relevante: ${input.research.relevantServices.join(', ') || 'Generale'}
- Avertismente: ${input.research.warnings.join(', ') || 'Niciuna'}

CALENDAR:
${input.research.calendarContext}

VOCE BRAND:
${input.research.brandVoiceContext}

Planifică strategia și returnează JSON-ul.`;

        const response = await this.callLLM(userPrompt);

        try {
            const parsed = this.parseJSON<StrategyOutput>(response);

            // Ensure all fields have defaults
            return {
                objective: parsed.objective || input.request.postType,
                emotionalApproach: parsed.emotionalApproach || 'Cald și empatic',
                persuasionPrinciple: parsed.persuasionPrinciple || 'Autoritate',
                contentStructure: parsed.contentStructure || 'hook-story-lesson-close',
                keyMessage: parsed.keyMessage || '',
                angle: parsed.angle || '',
                serviceMention: parsed.serviceMention || 'none',
                temperatures: parsed.temperatures || { safe: 0.3, creative: 0.8, emotional: 0.7 },
                hooks: parsed.hooks || [],
                ctas: parsed.ctas || ['Suntem aici pentru dumneavoastră.'],
            };
        } catch {
            this.log('Failed to parse, using defaults');
            return this.getDefaultStrategy(input.request);
        }
    }

    private getDefaultStrategy(request: GenerationRequest): StrategyOutput {
        const strategies: Record<string, Partial<StrategyOutput>> = {
            informative: {
                objective: 'educational',
                emotionalApproach: 'Informativ dar cald',
                persuasionPrinciple: 'Autoritate',
                serviceMention: 'none',
            },
            service: {
                objective: 'service',
                emotionalApproach: 'Profesional și îngrijitor',
                persuasionPrinciple: 'Autoritate',
                serviceMention: 'subtle',
            },
            community: {
                objective: 'community',
                emotionalApproach: 'Cald și personal',
                persuasionPrinciple: 'Simpatie',
                serviceMention: 'none',
            },
            seasonal: {
                objective: 'seasonal',
                emotionalApproach: 'Reverent și tradițional',
                persuasionPrinciple: 'Unitate',
                serviceMention: 'none',
            },
            supportive: {
                objective: 'supportive',
                emotionalApproach: 'Empatic și validant',
                persuasionPrinciple: 'Reciprocitate',
                serviceMention: 'none',
            },
        };

        const base = strategies[request.postType] || strategies.informative;

        return {
            objective: base.objective || 'educational',
            emotionalApproach: base.emotionalApproach || 'Cald',
            persuasionPrinciple: base.persuasionPrinciple || 'Autoritate',
            contentStructure: 'hook-story-lesson-close',
            keyMessage: '',
            angle: '',
            serviceMention: base.serviceMention || 'none',
            temperatures: { safe: 0.3, creative: 0.8, emotional: 0.7 },
            hooks: [],
            ctas: ['Suntem aici pentru dumneavoastră.'],
        };
    }
}
