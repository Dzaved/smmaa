'use client';

import { useState, useEffect } from 'react';

interface AIThinkingProps {
    isActive: boolean;
    currentStep?: string;
}

const STEPS = [
    { id: 'research', label: '🔍 Cercetare context...', duration: 3000 },
    { id: 'strategy', label: '🧠 Planificare strategie...', duration: 3500 },
    { id: 'writing', label: '✍️ Scriere variante...', duration: 4500 },
    { id: 'editing', label: '📝 Editare și corectare...', duration: 3000 },
    { id: 'optimizing', label: '📊 Optimizare engagement...', duration: 2500 },
    { id: 'finishing', label: '✨ Finalizare...', duration: 2000 },
];

export function AIThinking({ isActive, currentStep }: AIThinkingProps) {
    const [stepIndex, setStepIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        if (!isActive) {
            setStepIndex(0);
            setProgress(0);
            return;
        }

        // Dynamic step advancement based on specific durations
        let timer: NodeJS.Timeout;

        const advanceStep = () => {
            setStepIndex(current => {
                const next = current + 1;
                if (next < STEPS.length) {
                    // Schedule next step based on CURRENT step's duration
                    timer = setTimeout(advanceStep, STEPS[next].duration);
                    return next;
                }
                return current;
            });
        };

        // Start the sequence
        timer = setTimeout(advanceStep, STEPS[0].duration);

        // Smooth progress animation
        const progressTimer = setInterval(() => {
            setProgress(prev => {
                // Calculate target based on (stepIndex + 1) / total
                // We add a little randomness to make it feel organic
                const target = Math.min(
                    ((stepIndex + 1) / STEPS.length) * 100,
                    95 // Never hit 100% until actually done
                );

                if (prev < target) {
                    const diff = target - prev;
                    const increment = diff * 0.1; // Smooth ease-out
                    return prev + Math.max(0.5, increment);
                }
                return prev;
            });
        }, 100);

        return () => {
            clearTimeout(timer);
            clearInterval(progressTimer);
        };
    }, [isActive, stepIndex]);

    if (!isActive) return null;

    return (
        <div className="ai-thinking-container">
            <div className="ai-thinking-card">
                {/* Modern Abstract Animation */}
                <div className="brain-container">
                    <div className="brain-glow"></div>

                    {/* Floating Action Emoji or Brain SVG */}
                    {stepIndex === 5 ? (
                        <div className="brain-icon-wrapper">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="64"
                                height="64"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]"
                            >
                                <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
                                <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
                                <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
                                <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
                                <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
                                <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
                                <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
                                <path d="M6 18a4 4 0 0 1-1.938-.5" />
                                <path d="M19.938 17.5A4 4 0 0 1 18 18" />
                            </svg>
                        </div>
                    ) : (
                        <div className="action-emoji" key={stepIndex}>
                            {['🔍', '📂', '✍️', '✨', '📊'][stepIndex]}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="thinking-content">
                    {/* Dynamic Title based on Step */}
                    <h3 className="thinking-title">
                        {['Analiză Context', 'Planificare Strategie', 'Scriere Creativă', 'Rafinare Text', 'Maximizare Impact', 'Gata de Postare'][stepIndex]}
                    </h3>

                    {/* Spacer */}
                    <div className="mb-4"></div>

                    {/* Modern Progress Bar */}
                    <div className="progress-track">
                        <div
                            className="progress-fill"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {/* Single Clean Context Line */}
                    <div className="fact-container">
                        <p className="thinking-fact key-{stepIndex}">
                            {stepIndex === 0 && 'Cercetez contextul funerar și audiența...'}
                            {stepIndex === 1 && 'Aplic principii de persuasiune (Cialdini)...'}
                            {stepIndex === 2 && 'Generez 3 variante unice (Safe, Creativ, Emoțional)...'}
                            {stepIndex === 3 && 'Rafinez tonul si vocabularul...'}
                            {stepIndex === 4 && 'Calculez scorul de impact...'}
                            {stepIndex === 5 && 'Finalizez conținutul...'}
                        </p>
                    </div>
                </div>
            </div>

            <style jsx>{`
        .ai-thinking-container {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(12px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .ai-thinking-card {
          position: relative;
          background: rgba(20, 20, 25, 0.95);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 3rem;
          width: 90%;
          max-width: 380px;
          text-align: center;
          color: white;
          box-shadow: 
            0 20px 40px -10px rgba(0, 0, 0, 0.5),
            0 0 0 1px rgba(255, 255, 255, 0.05);
          animation: scaleUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .brain-container {
          position: relative;
          width: 80px;
          height: 80px;
          margin: 0 auto 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .brain-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.5) 0%, transparent 70%);
          filter: blur(20px);
          animation: pulseGlow 1.5s ease-in-out infinite alternate;
        }

        .brain-icon-wrapper {
          position: relative;
          z-index: 10;
          animation: float 2.5s ease-in-out infinite;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .action-emoji {
            position: absolute;
            font-size: 2.5rem;
            z-index: 20;
            animation: popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.3));
        }

        @keyframes popIn {
            0% { transform: scale(0) rotate(-45deg); opacity: 0; }
            70% { transform: scale(1.2) rotate(10deg); opacity: 1; }
            100% { transform: scale(1) rotate(0); opacity: 1; }
        }

        .thinking-title {
          font-size: 1.1rem;
          font-weight: 600;
          letter-spacing: -0.01em;
          margin-bottom: 0.5rem;
          background: linear-gradient(to right, #fff, #a5b4fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .thinking-step {
          font-size: 0.95rem;
          color: #94a3b8;
          margin-bottom: 2rem;
          height: 1.5rem;
        }

        .progress-track {
          height: 4px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 1.5rem;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #6366f1, #818cf8, #c084fc);
          border-radius: 4px;
          transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 0 10px rgba(99, 102, 241, 0.5);
        }

        .fact-container {
          min-height: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .thinking-fact {
          font-size: 0.85rem;
          color: #64748b;
          animation: fadeInText 0.5s ease;
        }

        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleUp { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes pulseGlow { from { opacity: 0.5; transform: scale(0.8); } to { opacity: 1; transform: scale(1.1); } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes fadeInText { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
        </div>
    );
}
