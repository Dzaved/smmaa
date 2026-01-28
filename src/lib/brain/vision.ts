/**
 * SMMAA Brain - Vision Module
 * 
 * Analyzes images and videos using Gemini Vision API.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface MediaAnalysis {
    description: string;
    objects: string[];
    mood: string;
    colors: string[];
    suggestedThemes: string[];
    isAppropriate: boolean;
    funeralContext?: {
        isFuneralRelated: boolean;
        elements: string[];
        suggestedTone: string;
    };
}

/**
 * Analyze an image using Gemini Vision
 */
export async function analyzeImage(base64Data: string, mimeType: string): Promise<MediaAnalysis> {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const prompt = `Analizează această imagine pentru un brand de servicii funerare (Funebra Brașov).

Răspunde în JSON cu această structură exactă:
{
  "description": "Descriere scurtă a imaginii în română (maxim 50 cuvinte)",
  "objects": ["lista", "de", "obiecte", "vizibile"],
  "mood": "atmosfera/starea de spirit transmisă",
  "colors": ["culorile", "predominante"],
  "suggestedThemes": ["teme pentru postare", "max 3"],
  "isAppropriate": true/false (dacă e potrivită pentru un brand funerar),
  "funeralContext": {
    "isFuneralRelated": true/false,
    "elements": ["elemente relevante: lumânări, flori, cruci, etc"],
    "suggestedTone": "tonul recomandat pentru postare"
  }
}

Fii sensibil și respectuos. Evită descrieri negative sau insensibile.`;

        const result = await model.generateContent([
            prompt,
            {
                inlineData: {
                    mimeType,
                    data: base64Data,
                },
            },
        ]);

        const text = result.response.text();

        // Extract JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('No JSON found in response');
        }

        const analysis: MediaAnalysis = JSON.parse(jsonMatch[0]);
        return analysis;

    } catch (error) {
        console.error('Vision analysis failed:', error);

        // Return fallback analysis
        return {
            description: 'Imagine încărcată',
            objects: [],
            mood: 'neutru',
            colors: [],
            suggestedThemes: [],
            isAppropriate: true,
            funeralContext: {
                isFuneralRelated: false,
                elements: [],
                suggestedTone: 'respectuos',
            },
        };
    }
}

/**
 * Convert file to base64
 */
export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // Remove the data:image/...;base64, prefix
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
    });
}

/**
 * Get MIME type from file
 */
export function getMimeType(file: File): string {
    return file.type || 'image/jpeg';
}

/**
 * Validate media file
 */
export function validateMedia(file: File): { valid: boolean; error?: string } {
    const maxImageSize = 10 * 1024 * 1024; // 10MB
    const maxVideoSize = 50 * 1024 * 1024; // 50MB

    const allowedImages = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const allowedVideos = ['video/mp4', 'video/webm'];

    const isImage = allowedImages.includes(file.type);
    const isVideo = allowedVideos.includes(file.type);

    if (!isImage && !isVideo) {
        return { valid: false, error: 'Format neacceptat. Folosește JPG, PNG, GIF, MP4 sau WebM.' };
    }

    if (isImage && file.size > maxImageSize) {
        return { valid: false, error: 'Imaginea e prea mare. Maximum 10MB.' };
    }

    if (isVideo && file.size > maxVideoSize) {
        return { valid: false, error: 'Videoul e prea mare. Maximum 50MB.' };
    }

    return { valid: true };
}

export const vision = {
    analyzeImage,
    fileToBase64,
    getMimeType,
    validateMedia,
};
