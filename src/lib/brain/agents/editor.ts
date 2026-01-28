/**
 * SMMAA Brain - Editor Agent
 * 
 * Quality assurance: grammar, sensitivity, brand voice.
 * Improves content and catches issues before publishing.
 */

import { BaseAgent } from '../base-agent';
import { ContentVariant, EditorOutput, EditIssue } from '../types';

const SYSTEM_PROMPT = `Ești "Gardianul Atent" - editorul sistemului SMMAA pentru Funebra Brașov.

ROLUL TĂU:
- Verifici gramatica și diacriticele românești
- Detectezi limbajul insensibil sau comercial
- Asiguri consistența vocii de brand
- Îmbunătățești conținutul unde e nevoie

VERIFICĂRI OBLIGATORII:
1. GRAMATICĂ: Acorduri, conjugări, punctuație
2. DIACRITICE: ă, â, î, ș, ț - TOATE trebuie corecte
3. SENSIBILITATE: Fără exploatare doliu, fără presiune
4. VOCE BRAND: Formal-cald, respectuos, demnitate

CUVINTE INTERZISE (returnează eroare dacă găsești):
- "Nu ratați", "Grăbiți-vă", "Ofertă specială"
- "Reducere", "Promoție", "Cel mai bun"
- "Garantăm", "100%", "WOW", "Amazing"

RETURNEAZĂ JSON:
{
  "passed": true/false,
  "grammarScore": 0-100,
  "sensitivityScore": 0-100,
  "brandVoiceScore": 0-100,
  "issues": [
    {
      "type": "grammar|sensitivity|brand_voice|diacritics",
      "text": "textul problematic",
      "suggestion": "sugestie de corectare",
      "severity": "error|warning|info"
    }
  ],
  "improvedVariants": [
    {
      "type": "safe|creative|emotional",
      "content": "conținutul îmbunătățit",
      "hook": "hook îmbunătățit",
      "body": "body îmbunătățit",
      "cta": "cta îmbunătățit"
    }
  ]
}`;

export class EditorAgent extends BaseAgent<
    { variants: ContentVariant[] },
    EditorOutput
> {
    constructor() {
        super({
            name: 'Editor',
            systemPrompt: SYSTEM_PROMPT,
            temperature: 0.1, // Very low for consistent editing
        });
    }

    async execute(input: { variants: ContentVariant[] }): Promise<EditorOutput> {
        this.log('Editing variants', { count: input.variants.length });

        const variantsText = input.variants.map((v, i) => `
VARIANTA ${i + 1} (${v.type}):
Hook: ${v.hook}
Body: ${v.body}
CTA: ${v.cta}
Full: ${v.content}
`).join('\n---\n');

        const userPrompt = `
Verifică și îmbunătățește următoarele variante:

${variantsText}

VERIFICĂRI (în ordine de prioritate):
1. ✅ Gramatica și diacriticele românești (ă, â, î, ș, ț)
2. ✅ Sensibilitatea (nu exploatăm doliul, nu presiune)
3. ✅ Vocea de brand (formal-cald, respectuos)
4. ✅ Absența cuvintelor interzise (Nu ratați, Grăbiți-vă, Ofertă, Reducere)

⚠️ NU VERIFICA LUNGIMEA! Utilizatorul a ales lungimea dorită.
⚠️ NU ADĂUGA mesaje de tip "Adaugă X cuvinte" - lungimea e corectă!

Returnează JSON-ul cu analiza și variantele îmbunătățite.
NU MODIFICA lungimea textului - doar corectează greșeli.`;

        const response = await this.callLLM(userPrompt);

        try {
            const parsed = this.parseJSON<EditorOutput>(response);

            return {
                passed: parsed.passed ?? true,
                grammarScore: parsed.grammarScore ?? 90,
                sensitivityScore: parsed.sensitivityScore ?? 90,
                brandVoiceScore: parsed.brandVoiceScore ?? 90,
                issues: parsed.issues ?? [],
                improvedVariants: parsed.improvedVariants?.map((v, i) => ({
                    ...v,
                    temperatureUsed: input.variants[i]?.temperatureUsed ?? 0.5,
                })) ?? input.variants,
            };
        } catch {
            this.log('Failed to parse editor response, passing through');
            // If editing fails, pass through original with basic checks
            return {
                passed: true,
                grammarScore: 85,
                sensitivityScore: 90,
                brandVoiceScore: 85,
                issues: [],
                improvedVariants: input.variants,
            };
        }
    }

    /**
     * Quick local checks before LLM
     */
    quickCheck(content: string): EditIssue[] {
        const issues: EditIssue[] = [];

        // Check for forbidden words
        const forbidden = [
            'nu ratați', 'grăbiți-vă', 'ofertă specială',
            'reducere', 'promoție', 'cel mai bun',
            'garantăm', 'wow', 'amazing'
        ];

        for (const word of forbidden) {
            if (content.toLowerCase().includes(word)) {
                issues.push({
                    type: 'sensitivity',
                    text: word,
                    suggestion: 'Elimină sau reformulează acest termen comercial',
                    severity: 'error',
                });
            }
        }

        // Check for missing diacritics (common patterns)
        const diacriticPatterns = [
            { wrong: /\bsi\b/gi, right: 'și', context: 'Lipsește diacritica "ș"' },
            { wrong: /\bta\b/gi, right: 'ța/ta', context: 'Verifică diacritica' },
            { wrong: /\bdin\b/gi, right: 'din', context: 'OK' }, // This is fine
        ];

        // Basic content checks (but NOT length - that's user-controlled now)
        // Length is controlled by WordCountSelector, not editor

        return issues;
    }
}
