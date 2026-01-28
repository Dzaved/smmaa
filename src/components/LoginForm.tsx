'use client';

import { useState } from 'react';
import { login } from '@/lib/auth';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(password);
            if (result.success) {
                router.push('/dashboard');
                router.refresh();
            } else {
                setError(result.error || 'Eroare de autentificare');
            }
        } catch {
            setError('Eroare de conexiune');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="card login-card card-elevated animate-fade-in">
                <div className="login-icon">SM</div>
                <h1 className="login-title">SMMAA</h1>
                <p className="login-subtitle">Social Media Manager AI Assistant</p>

                <form onSubmit={handleSubmit} className="login-form">
                    <div>
                        <label htmlFor="password" className="label">Parolă</label>
                        <input
                            type="password"
                            id="password"
                            className="input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Introdu parola"
                            required
                            autoFocus
                        />
                    </div>

                    {error && <div className="login-error">{error}</div>}

                    <button
                        type="submit"
                        className="btn btn-primary btn-large"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="loader"></span>
                                Se încarcă...
                            </>
                        ) : (
                            'Conectare'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
