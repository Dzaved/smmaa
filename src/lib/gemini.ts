import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export type Platform = 'facebook' | 'instagram' | 'tiktok';
export type PostType =
    | 'informative'
    | 'service'
    | 'community'
    | 'seasonal'
    | 'supportive';
export type Tone = 'formal' | 'cald' | 'compasionat';

interface GenerateContentParams {
    platform: Platform;
    postType: PostType;
    tone: Tone;
    customPrompt?: string;
    knowledgeBase?: string;
}

interface GeneratedContent {
    content: string;
    hashtags: string[];
    tip: string;
}

// Platform-specific guidelines
const platformGuidelines: Record<Platform, string> = {
    facebook: `
PLATFORMA: Facebook
- Lungime: 300-500 cuvinte, text mai lung și detaliat
- Poate include link-uri
- 5-10 hashtag-uri
- Ton: formal dar cald, profesional
- Audiență: 35-65 ani, familii
- Formatare: paragrafe scurte, emoji-uri subtile`,

    instagram: `
PLATFORMA: Instagram
- Lungime: 150-300 cuvinte, caption concis dar impactant
- Fără link-uri în caption (menționează "link în bio" dacă e cazul)
- 15-20 hashtag-uri relevante
- Ton: vizual, emoțional, autentic
- Audiență: 25-55 ani
- Include sugestie pentru tip de imagine`,

    tiktok: `
PLATFORMA: TikTok
- Lungime: 50-100 cuvinte MAXIM, foarte concis
- 4-6 hashtag-uri trending
- Ton: direct, uman, accesibil
- Audiență: 20-45 ani
- Include sugestie pentru tip de video
- Hook puternic în primele cuvinte`
};

// Post type templates
const postTypeTemplates: Record<PostType, string> = {
    informative: `
TIP POST: Educațional/Informativ
Scopul: Educarea publicului despre procesul funerar, tradiții, sau planificare
Exemple de teme:
- Pașii organizării unei înmormântări
- Tradiții funerare ortodoxe românești
- Beneficiile planificării în avans
- Ce să faci când pierzi o persoană dragă
- Diferențe între opțiuni (înhumare, cremație)`,

    service: `
TIP POST: Prezentare Servicii
Scopul: Evidențierea serviciilor oferite într-un mod respectuos
Exemple de teme:
- Disponibilitate 24/7
- Aranjamente florale personalizate
- Transport funerar profesional
- Catering pentru pomeni și parastase
- Calitatea sicriilor și produselor`,

    community: `
TIP POST: Comunitate și Încredere
Scopul: Construirea relației cu comunitatea
Exemple de teme:
- Experiența echipei (20+ ani)
- Recenzii și testimoniale
- Implicare în comunitatea locală din Brașov
- Prezentarea echipei cu empatie
- Angajamentul față de calitate`,

    seasonal: `
TIP POST: Sezonier/Religios
Scopul: Postări legate de momente importante din an
Exemple de teme:
- Paștele și Învierea (speranță, lumină)
- Ziua Morților / Luminație
- Crăciun (amintirea celor plecați)
- Moșii de vară/toamnă
- Aniversări, comemorări`,

    supportive: `
TIP POST: Sprijin și Compasiune
Scopul: Oferirea de comfort și sprijin emoțional
Exemple de teme:
- Citate despre viață, amintiri, speranță
- Mesaje de încurajare pentru cei în doliu
- Sfaturi pentru gestionarea durerii
- Celebrarea vieții și amintirilor
- Mesaje de empatie și înțelegere`
};

// Tone modifiers
const toneModifiers: Record<Tone, string> = {
    formal: 'Ton formal, profesional, respectuos. Folosește un limbaj elevat dar accesibil.',
    cald: 'Ton cald, prietenos dar profesional. Transmite empatie și apropiere.',
    compasionat: 'Ton foarte empatic și compasionat. Concentrează-te pe suportul emoțional și înțelegere.'
};

// Funebra knowledge base (default)
const funebraKnowledge = `
INFORMAȚII COMPANIE - FUNEBRA BRAȘOV:

Descriere: Firmă de servicii funerare complete din Brașov, România
Locație: Strada 13 Decembrie, Nr. 50, Brașov
Contact: +40 722 656 768, +40 741 156 929
Email: contact@funebra.ro
Experiență: Peste 20 de ani în domeniu
Echipă: Peste 10 angajați profesioniști
Disponibilitate: NON-STOP, 24/7
Rating Google: 5 stele

VALORI FUNDAMENTALE:
- Demnitate
- Eleganță
- Profesionalism
- Compasiune
- Respect

SERVICII OFERITE:
1. Constatare deces - medic disponibil 24/7
2. Tanatopraxie - îmbălsămare profesională și toaletare
3. Transport funerar - flotă modernă, preluare de la domiciliu
4. Aranjamente florale - coroane, jerbe, buchete personalizate
5. Produse funerare - sicrie economice și premium (29+ modele)
6. Catering pomeni și parastase - meniuri de dulce și post

PRODUSE:
- Sicrie economice și premium
- Cruci și felinare
- Candele și lumânări
- Prosoape și batiste tradiționale
- Accesorii de doliu
- Colivă tradițională

DIFERENȚIATORI:
- Răspuns rapid (30 minute oriunde în Brașov)
- Servicii complete sub același acoperiș
- Prețuri competitive cu calitate superioară
- Experiență vastă și recenzii excelente
`;

export async function generateContent(params: GenerateContentParams): Promise<GeneratedContent> {
    const { platform, postType, tone, customPrompt, knowledgeBase } = params;

    const systemPrompt = `Ești un expert în crearea de conținut pentru rețele sociale pentru o firmă de servicii funerare din România.

REGULI ABSOLUTE:
- Scrie DOAR în limba română
- Folosește diacritice corecte (ă, â, î, ș, ț)
- NU folosi limbaj comercial agresiv sau clickbait
- NU pune accent pe prețuri
- NU folosi expresii clișeice sau superficiale
- EVITĂ orice ar putea părea că exploatezi durerea
- Respectă tradițiile ortodoxe românești
- Fii empatic și respectuos întotdeauna

${platformGuidelines[platform]}

${postTypeTemplates[postType]}

TON: ${toneModifiers[tone]}

CUNOȘTINȚE DESPRE COMPANIE:
${knowledgeBase || funebraKnowledge}

${customPrompt ? `INSTRUCȚIUNI SUPLIMENTARE: ${customPrompt}` : ''}

FORMATUL RĂSPUNSULUI (JSON strict):
{
  "content": "textul complet al postării aici",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
  "tip": "un sfat scurt despre cum să folosești această postare sau ce imagine/video să asociezi"
}

Generează acum o postare originală, creativă și respectuoasă.`;

    try {
        // Using Gemini 2.0 Flash
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const result = await model.generateContent(systemPrompt);
        const response = result.response;
        const text = response.text();

        // Parse JSON response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                content: parsed.content || '',
                hashtags: parsed.hashtags || [],
                tip: parsed.tip || ''
            };
        }

        // Fallback if JSON parsing fails
        return {
            content: text,
            hashtags: [],
            tip: 'Verifică formatul răspunsului'
        };
    } catch (error: unknown) {
        console.error('Error generating content:', error);

        // Provide more specific error messages
        if (error instanceof Error) {
            if (error.message.includes('API_KEY')) {
                throw new Error('Cheia API nu este configurată corect.');
            }
            if (error.message.includes('404')) {
                throw new Error('Modelul AI nu este disponibil. Contactează administratorul.');
            }
            if (error.message.includes('quota') || error.message.includes('limit')) {
                throw new Error('Limita de utilizare a fost atinsă. Încearcă mai târziu.');
            }
        }
        throw new Error('Nu am putut genera conținutul. Încearcă din nou.');
    }
}
