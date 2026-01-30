/**
 * SMMAA Brain - Writer Agent
 * 
 * Creates 3 DISTINCTLY DIFFERENT content variants:
 * - SIGUR: Conservative, proven, safe messaging
 * - CREATIV: Innovative, unexpected, fresh approach
 * - EMOTIONAL: Heart-driven, storytelling, deep connection
 * 
 * Uses different temperatures AND different prompts for each.
 */

import { BaseAgent } from '../base-agent';
import { GenerationRequest, StrategyOutput, WriterOutput, ContentVariant, Platform } from '../types';
import { getSuccessfulPatterns } from '../intelligence';
import { STRATEGY_2026_VOCABULARY } from '../knowledge/strategy_2026';

export class WriterAgent extends BaseAgent<
    { request: GenerationRequest; strategy: StrategyOutput; context: string },
    WriterOutput
> {
    // Dynamic Style Flavors to break repetition
    private creativeStyles = [
        "METAFORIC: Folosește o metaforă centrală extinsă (ex: viața ca un anotimp, amintirea ca o lumină).",
        "MINIMALIST: Fraze scurte, percutante. Spații albe. Mai multă tăcere decât zgomot.",
        "FILOSOFIC: Pune o întrebare existențială profundă. Fii reflexiv.",
        "POETIC: Limbaj liric, imagini vizuale puternice, ritm lent.",
        "NARATIV: Începe direct în mijlocul unei acțiuni sau scene imaginare."
    ];

    private emotionalStyles = [
        "CONFESIV: Scrie ca o scrisoare personală, intimă.",
        "SENZORIAL: Concentrează-te pe simțuri (mirosul lumânărilor, liniștea serii, atingerea mâinii).",
        "NOSTALGIC: Evocă frumusețea trecutului fără a fi prea trist.",
        "ÎNCURAJATOR: Fii vocea puternică care spune 'vei trece peste asta'.",
        "VULNERABIL: Recunoaște deschis cât de grea e durerea, validează suferința."
    ];

    constructor() {
        super({
            name: 'Writer',
            systemPrompt: `Ești scriitorul principal Funebra Brașov. Ești un maestru al cuvintelor care știe să evite clișeele.
NU folosi expresii 'de lemn' sau repetări inutile.
Fiecare text trebuie să sune unic, scris de un om, nu de un robot.
Scrii DOAR în limba română cu diacritice corecte.`,
            temperature: 0.7,
        });
    }

    async execute(input: { request: GenerationRequest; strategy: StrategyOutput; context: string }): Promise<WriterOutput> {
        this.log('Writing content', {
            platform: input.request.platform,
            wordCount: input.request.wordCount,
        });

        const successfulHooks = await getSuccessfulPatterns(input.request.platform, input.request.postType, 'hook');
        const patternsContext = successfulHooks.length > 0
            ? `\n🌟 SUCCES ANTERIOR (Inspirație doar, NU copia): ${successfulHooks.slice(0, 2).join(' | ')}`
            : '';

        const variants: ContentVariant[] = [];
        const baseContext = this.buildBaseContext(input, patternsContext);

        // Generate variants with RANDOMIZED styles (Sequentially to respect global throttle)
        variants.push(await this.generateSafeVariant(baseContext));
        variants.push(await this.generateCreativeVariant(baseContext));
        variants.push(await this.generateEmotionalVariant(baseContext));

        return {
            variants,
            metadata: {
                platform: input.request.platform,
                postType: input.request.postType,
                tone: input.request.tone,
                strategy: input.strategy.contentStructure,
            },
        };
    }

    private buildBaseContext(
        input: { request: GenerationRequest; strategy: StrategyOutput; context: string },
        patternsContext: string = ''
    ): string {
        const wordGuide = this.getWordCountGuide(input.request.wordCount);

        let mediaSection = '';
        if (input.request.mediaAnalysis) {
            const m = input.request.mediaAnalysis;
            mediaSection = `
🖼️ CONTEXT VIZUAL (Fii specific, leagă textul de imagine!):
Descriere: ${m.description}
Atmosferă: ${m.mood}
${m.funeralContext?.isFuneralRelated ? `Elemente: ${m.funeralContext.elements.join(', ')}` : ''}
`;
        }

        let brandContext = '';
        let forbiddenExtras: string[] = [];

        if (input.request.brandSettings) {
            const bs = input.request.brandSettings;
            brandContext = `
CONTEXT BRAND:
Nume: ${bs.companyName}
Descriere: ${bs.description}
${bs.preferredPhrases.length > 0 ? `Expresii Preferate (folosește dacă e natural): ${bs.preferredPhrases.join(', ')}` : ''}
`;
            if (bs.forbiddenWords && bs.forbiddenWords.length > 0) {
                forbiddenExtras = bs.forbiddenWords;
            }
        }

        const defaultForbidden = [
            "ecoul pașilor", "labirintul durerii", "punte fragilă", "simfonie de...",
            "ofrandă adusă", "reflexe aurii", "cărări ale vieții"
        ];

        // MERGE 2026 STRATEGY VOCABULARY
        const strategyForbidden = STRATEGY_2026_VOCABULARY.forbidden;
        const strategyRecommended = STRATEGY_2026_VOCABULARY.recommended.join(', ');

        const allForbidden = [...defaultForbidden, ...forbiddenExtras, ...strategyForbidden].join('", "');

        return `
${mediaSection}
${brandContext}
${patternsContext}

CONTEXT STRATEGIC:
Obiectiv: ${input.strategy.keyMessage}
Unghi abordare: ${input.strategy.angle}

RESTRICTII:
- Lungime: ${wordGuide}
- Platformă: ${input.request.platform.toUpperCase()}
- Ton General: ${input.request.tone}
${input.request.customPrompt ? `- Instrucțiuni Extra: ${input.request.customPrompt}` : ''}

⛔ A NU SE FOLOSI (Clișee interzise și termeni interziși de brand):
"${allForbidden}"

✅ RECOMANDAT (Vocabular Brand 2026):
"${strategyRecommended}"

Găsește metafore NOI. Fii simplu și autentic.
`;
    }


    private getWordCountGuide(wordCount?: 'short' | 'medium' | 'long'): string {
        switch (wordCount) {
            case 'short': return `FOARTE SCURT(15 - 30 cuv).Esențializat.`;
            case 'medium': return `MEDIU(40 - 70 cuv).Echilibrat.`;
            case 'long': return `DETALIAT(100 - 150 cuv).Storytelling.`;
            default: return `MEDIU(40 - 70 cuv).`;
        }
    }

    // Dynamic temperature helper (Base ± 0.1)
    private getDynamicTemp(base: number): number {
        const variation = (Math.random() * 0.2) - 0.1; // -0.1 to +0.1
        return Number((base + variation).toFixed(2));
    }

    private getRandomStyle(styles: string[]): string {
        return styles[Math.floor(Math.random() * styles.length)];
    }

    private async generateSafeVariant(baseContext: string): Promise<ContentVariant> {
        const temp = this.getDynamicTemp(0.35); // Slightly higher than 0.3 for a bit more natural flow
        const prompt = `${baseContext}
        
VREAU VARIANTA "SIGUR / STANDARD"
        Stil: Profesional, Respectuos, Clar.
            Abordare: Instituție de încredere, fără înflorituri inutile.
        
RETURNEAZĂ JSON: { "hook": "...", "body": "...", "cta": "..." } `;

        const response = await this.callLLM(prompt, temp);
        return this.extractVariant(response, 'safe', temp);
    }

    private async generateCreativeVariant(baseContext: string): Promise<ContentVariant> {
        const style = this.getRandomStyle(this.creativeStyles);
        const temp = this.getDynamicTemp(0.85);

        const prompt = `${baseContext}

VREAU VARIANTA "CREATIV"
🔥 STIL IMPUS: ${style}
Fii inventiv.Evită orice formulare standard.Surprinde cititorul.

RETURNEAZĂ JSON: { "hook": "...", "body": "...", "cta": "..." } `;

        const response = await this.callLLM(prompt, temp);
        return this.extractVariant(response, 'creative', temp);
    }

    private async generateEmotionalVariant(baseContext: string): Promise<ContentVariant> {
        const style = this.getRandomStyle(this.emotionalStyles);
        const temp = this.getDynamicTemp(0.75);

        const prompt = `${baseContext}

VREAU VARIANTA "EMOȚIONAL"
❤️ STIL IMPUS: ${style}
Vorbește de la om la om.Fără limbaj corporatist.
Folosește cuvinte simple, calde, care ating inima.

RETURNEAZĂ JSON: { "hook": "...", "body": "...", "cta": "..." } `;

        const response = await this.callLLM(prompt, temp);
        return this.extractVariant(response, 'emotional', temp);
    }

    private extractVariant(response: string, type: 'safe' | 'creative' | 'emotional', temperature: number): ContentVariant {
        try {
            const parsed = this.parseJSON<{ hook?: string; body?: string; cta?: string; content?: string }>(response);
            let content = parsed.content;
            if (!content || content.length < 10) {
                content = [parsed.hook, parsed.body, parsed.cta].filter(Boolean).join('\n\n');
            }
            return {
                type,
                hook: parsed.hook || '',
                body: parsed.body || '',
                cta: parsed.cta || '',
                content: content || response.trim(),
                temperatureUsed: temperature,
            };
        } catch {
            return {
                type,
                hook: '',
                body: response.trim(),
                cta: '',
                content: response.trim(),
                temperatureUsed: temperature,
            };
        }
    }
}
