'use server';

import { cookies } from 'next/headers';

const COOKIE_NAME = 'smmaa_auth';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function login(password: string): Promise<{ success: boolean; error?: string }> {
    const correctPassword = process.env.APP_PASSWORD || 'funebra2026';

    if (password === correctPassword) {
        const cookieStore = await cookies();
        cookieStore.set(COOKIE_NAME, 'authenticated', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: COOKIE_MAX_AGE,
            path: '/'
        });
        return { success: true };
    }

    return { success: false, error: 'Parolă incorectă' };
}

export async function logout(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete(COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get(COOKIE_NAME);
    return authCookie?.value === 'authenticated';
}
