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

export class WriterAgent extends BaseAgent<
    { request: GenerationRequest; strategy: StrategyOutput; context: string },
    WriterOutput
> {
    constructor() {
        super({
            name: 'Writer',
            systemPrompt: `Ești scriitor pentru Funebra Brașov. Scrii DOAR în limba română cu diacritice corecte.`,
            temperature: 0.7,
        });
    }

    async execute(input: { request: GenerationRequest; strategy: StrategyOutput; context: string }): Promise<WriterOutput> {
        this.log('Writing content', {
            platform: input.request.platform,
            hasMedia: !!input.request.mediaAnalysis,
            wordCount: input.request.wordCount,
        });

        const variants: ContentVariant[] = [];

        // Build the base context that all variants share
        const baseContext = this.buildBaseContext(input);

        // Generate each variant with COMPLETELY DIFFERENT prompts
        const safeVariant = await this.generateSafeVariant(baseContext, input);
        const creativeVariant = await this.generateCreativeVariant(baseContext, input);
        const emotionalVariant = await this.generateEmotionalVariant(baseContext, input);

        variants.push(safeVariant, creativeVariant, emotionalVariant);

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

    private buildBaseContext(input: { request: GenerationRequest; strategy: StrategyOutput; context: string }): string {
        const wordGuide = this.getWordCountGuide(input.request.wordCount);

        // Media context FIRST if available
        let mediaSection = '';
        if (input.request.mediaAnalysis) {
            const m = input.request.mediaAnalysis;
            mediaSection = `
🖼️ IMAGINE/VIDEO ÎNCĂRCATĂ - DESCRIE CE VEZI:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Descriere: ${m.description}
Obiecte: ${m.objects.join(', ')}
Atmosferă: ${m.mood}
Culori: ${m.colors.join(', ')}
${m.funeralContext?.isFuneralRelated ? `Elemente funerare: ${m.funeralContext.elements.join(', ')}` : ''}

⚠️ OBLIGATORIU: Textul TREBUIE să descrie/refere imaginea!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
        }

        return `
${mediaSection}
📏 LUNGIME OBLIGATORIE:
${wordGuide}

📱 Platformă: ${input.request.platform.toUpperCase()}
📝 Tip: ${input.request.postType}
🎭 Ton: ${input.request.tone}
${input.request.customPrompt ? `💬 Instrucțiuni: ${input.request.customPrompt}` : ''}

🎯 Obiectiv: ${input.strategy.keyMessage}
`;
    }

    private getWordCountGuide(wordCount?: 'short' | 'medium' | 'long'): string {
        switch (wordCount) {
            case 'short':
                return `SCURT = EXACT 15-30 cuvinte. Nu mai mult! Fii extrem de concis.`;
            case 'medium':
                return `MEDIU = EXACT 40-70 cuvinte. Nici mai puțin, nici mai mult!`;
            case 'long':
                return `LUNG = EXACT 100-150 cuvinte. Storytelling detaliat.`;
            default:
                return `MEDIU = EXACT 40-70 cuvinte.`;
        }
    }

    private async generateSafeVariant(
        baseContext: string,
        input: { request: GenerationRequest; strategy: StrategyOutput; context: string }
    ): Promise<ContentVariant> {
        const prompt = `${baseContext}

═══════════════════════════════════════════════════════
SCRIE VARIANTA "SIGUR" - Conservatoare, de încredere
═══════════════════════════════════════════════════════

CARACTERISTICI OBLIGATORII pentru varianta SIGUR:
• Limbaj clasic, sobru, profesional
• Fără metafore îndrăznețe sau creații lingvistice
• Mesaj direct și clar
• Tonul unei instituții de încredere
• Folosește "dumneavoastră"
• Evită emoții intense

STRUCTURA:
1. Hook simplu și direct (max 10 cuvinte)
2. Mesaj principal clar
3. CTA profesional ("Suntem alături de dumneavoastră")

RETURNEAZĂ DOAR JSON:
{
  "hook": "primul rând captivant",
  "body": "corpul mesajului",
  "cta": "call to action",
  "content": "textul COMPLET gata de copiat"
}`;

        const response = await this.callLLM(prompt, 0.3);
        return this.extractVariant(response, 'safe', 0.3);
    }

    private async generateCreativeVariant(
        baseContext: string,
        input: { request: GenerationRequest; strategy: StrategyOutput; context: string }
    ): Promise<ContentVariant> {
        const prompt = `${baseContext}

═══════════════════════════════════════════════════════
SCRIE VARIANTA "CREATIV" - Inovatoare, surprinzătoare
═══════════════════════════════════════════════════════

CARACTERISTICI OBLIGATORII pentru varianta CREATIV:
• Abordare neașteptată, unică
• Metafore interesante despre viață, amintiri, timp
• Folosește imagini poetice
• Poate începe cu o întrebare provocatoare
• Stil fresh, modern, dar respectuos
• Creativitate în exprimare

EXEMPLE DE HOOK-URI CREATIVE:
- "Ce rămâne când totul se schimbă?"
- "Uneori, cel mai greu lucru..."
- "Într-o lume a grabei..."

STRUCTURA:
1. Hook surprinzător/poetic
2. Dezvoltare creativă cu metafore
3. CTA elegant

RETURNEAZĂ DOAR JSON:
{
  "hook": "primul rând captivant și CREATIV",
  "body": "corpul mesajului CU METAFORE",
  "cta": "call to action elegant",
  "content": "textul COMPLET gata de copiat"
}`;

        const response = await this.callLLM(prompt, 0.9);
        return this.extractVariant(response, 'creative', 0.9);
    }

    private async generateEmotionalVariant(
        baseContext: string,
        input: { request: GenerationRequest; strategy: StrategyOutput; context: string }
    ): Promise<ContentVariant> {
        const prompt = `${baseContext}

═══════════════════════════════════════════════════════
SCRIE VARIANTA "EMOȚIONAL" - Din inimă, profundă
═══════════════════════════════════════════════════════

CARACTERISTICI OBLIGATORII pentru varianta EMOȚIONAL:
• Scrie de parcă ai fi trecut personal prin doliu
• Conectează-te la emoții universale: dragoste, pierdere, speranță
• Folosește "noi" și "împreună"
• Include detalii senzoriale (lumină, căldură, liniște)
• Poveste scurtă sau moment personal
• Tonul unui prieten care a înțeles durerea

EXEMPLE DE HOOK-URI EMOȚIONALE:
- "Știm că acest moment e greu..."
- "Când pierdem pe cineva drag..."
- "Amintirile nu dispar niciodată..."

STRUCTURA:
1. Hook emoțional care arată empatie
2. Mesaj plin de căldură și înțelegere
3. CTA care oferă confort ("Nu ești singur")

RETURNEAZĂ DOAR JSON:
{
  "hook": "primul rând EMOȚIONAL și empatic",
  "body": "corpul mesajului CU EMPATIE PROFUNDĂ",
  "cta": "call to action reconfortant",
  "content": "textul COMPLET gata de copiat"
}`;

        const response = await this.callLLM(prompt, 0.7);
        return this.extractVariant(response, 'emotional', 0.7);
    }

    private getPlatformGuide(platform: Platform): string {
        const guides: Record<Platform, string> = {
            facebook: `Facebook: 50-100 cuvinte, storytelling permis`,
            instagram: `Instagram: 30-70 cuvinte, focus vizual`,
            tiktok: `TikTok: 20-50 cuvinte, foarte concis`,
        };
        return guides[platform];
    }

    private extractVariant(response: string, type: 'safe' | 'creative' | 'emotional', temperature: number): ContentVariant {
        try {
            const parsed = this.parseJSON<{ hook?: string; body?: string; cta?: string; content?: string }>(response);

            // Build content from parts if content is missing
            let content = parsed.content;
            if (!content || content.length < 20) {
                content = [parsed.hook, parsed.body, parsed.cta].filter(Boolean).join('\n\n');
            }

            return {
                type,
                hook: parsed.hook || '',
                body: parsed.body || '',
                cta: parsed.cta || 'Suntem aici pentru dumneavoastră.',
                content: content || response.trim(),
                temperatureUsed: temperature,
            };
        } catch {
            // If JSON parsing fails, use the raw response
            this.log(`Failed to parse JSON for ${type}, using raw response`);
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
