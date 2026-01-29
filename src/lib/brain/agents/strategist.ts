/**
 * SMMAA Brain - Strategist Agent
 * 
 * Plans the content approach using psychology principles.
 * Applies Cialdini's principles and grief psychology.
 * NOW UPDATED: Generates specific "Creative Angles" to force unique perspectives.
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
  "angle": "unghiul unic impus de sistem",
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
    // Dynamic Angles to force conceptual variety
    private angles = [
        "TIMPUL CA VINDECĂTOR: Explorează ideea trecerii timpului nu ca uitare, ci ca transformare.",
        "LOCUL GOL: Vorbește despre absență ca o formă de prezență continuă în suflet.",
        "CERUL ȘI PĂMÂNTUL: Folosește contrastul dintre efemer si etern.",
        "LINIȘTEA DE DUPĂ: Concentrează-te pe momentul de pace care vine după furtuna durerii.",
        "MOȘTENIREA INVIZIBILĂ: Ce rămâne în noi de la cei plecați (gesturi, vorbe, trăsături).",
        "MÂINILE CARE AJUTĂ: Îndreaptă focusul spre comunitate și sprijinul celor din jur.",
        "NATURA CA OGLINDĂ: Folosește anotimpurile sau elemente naturale ca metafore pentru viață.",
        "LUMINA DIN ÎNTUNERIC: Găsirea micilor bucurii chiar și în cele mai grele momente.",
        "VOCEA AMINTIRII: Cum sună amintirea cuiva drag? (vizual/auditiv).",
        "PUNTEA DINTRE LUMI: Ritualurile ca mod de conectare."
    ];

    constructor() {
        super({
            name: 'Strategist',
            systemPrompt: SYSTEM_PROMPT,
            temperature: 0.5, // Slightly increased for more varied strategy interpretation
        });
    }

    async execute(input: { request: GenerationRequest; research: ResearcherOutput }): Promise<StrategyOutput> {
        this.log('Planning strategy', { postType: input.request.postType, tone: input.request.tone });

        // Randomly select a creative angle to FORCE variation
        const assignedAngle = this.getRandomAngle();

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
VOCE BRAND:
${input.research.brandVoiceContext}
${input.request.brandSettings ? `
SETTINGS BRAND:
- Nume: ${input.request.brandSettings.companyName}
- Descriere: ${input.request.brandSettings.description}
- Ton (1-10): Formal-Informal=${input.request.brandSettings.toneBalance}, Emoțional=${input.request.brandSettings.emotionalLevel}, Religios=${input.request.brandSettings.religiousLevel}
` : ''}

IMPORTANT: Strategia TREBUIE să fie construită în jurul acestui UNGHI CREATIV specific:
👉 UNGHI IMPUS: "${assignedAngle}"
Dezvoltă "keyMessage" și "hooks" pornind strict de la acest unghi.

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
                angle: parsed.angle || assignedAngle, // Fallback to our assigned angle if AI forgot it
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

    private getRandomAngle(): string {
        return this.angles[Math.floor(Math.random() * this.angles.length)];
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
            angle: 'Suport și Împărtășire',
            serviceMention: base.serviceMention || 'none',
            temperatures: { safe: 0.3, creative: 0.8, emotional: 0.7 },
            hooks: [],
            ctas: ['Suntem aici pentru dumneavoastră.'],
        };
    }
}
