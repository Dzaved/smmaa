'use client';

import { useState, useEffect } from 'react';

interface AIThinkingProps {
    isActive: boolean;
    currentStep?: string;
}

const STEPS = [
    { id: 'research', label: '🔍 Cercetare context...', duration: 2000 },
    { id: 'strategy', label: '🧠 Planificare strategie...', duration: 2500 },
    { id: 'writing', label: '✍️ Scriere variante...', duration: 4000 },
    { id: 'editing', label: '📝 Editare și corectare...', duration: 2000 },
    { id: 'optimizing', label: '📊 Optimizare engagement...', duration: 1500 },
    { id: 'finishing', label: '✨ Finalizare...', duration: 1000 },
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

        // Auto-advance through steps
        const stepTimer = setInterval(() => {
            setStepIndex(prev => {
                if (prev < STEPS.length - 1) return prev + 1;
                return prev;
            });
        }, 2500);

        // Smooth progress animation
        const progressTimer = setInterval(() => {
            setProgress(prev => {
                const target = ((stepIndex + 1) / STEPS.length) * 100;
                if (prev < target) return Math.min(prev + 1, target);
                return prev;
            });
        }, 50);

        return () => {
            clearInterval(stepTimer);
            clearInterval(progressTimer);
        };
    }, [isActive, stepIndex]);

    if (!isActive) return null;

    return (
        <div className="ai-thinking-container">
            <div className="ai-thinking-card">
                {/* Brain Animation */}
                <div className="brain-animation">
                    <div className="brain-pulse"></div>
                    <div className="brain-icon">🧠</div>
                </div>

                {/* Current Step */}
                <div className="thinking-content">
                    <h3 className="thinking-title">AI Brain la lucru</h3>
                    <p className="thinking-step">
                        {currentStep || STEPS[stepIndex]?.label || 'Procesare...'}
                    </p>

                    {/* Progress Bar */}
                    <div className="thinking-progress-container">
                        <div
                            className="thinking-progress-bar"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {/* Step Indicators */}
                    <div className="step-indicators">
                        {STEPS.map((step, index) => (
                            <div
                                key={step.id}
                                className={`step-dot ${index <= stepIndex ? 'active' : ''} ${index === stepIndex ? 'current' : ''}`}
                                title={step.label}
                            />
                        ))}
                    </div>
                </div>

                {/* Fun Facts */}
                <p className="thinking-fact">
                    {stepIndex === 0 && '📚 Accesez baza de cunoștințe Funebra...'}
                    {stepIndex === 1 && '🎯 Aplic principiile psihologiei persuasiunii...'}
                    {stepIndex === 2 && '✨ Generez 3 variante cu temperaturi diferite...'}
                    {stepIndex === 3 && '🔍 Verific gramatica și diacriticele românești...'}
                    {stepIndex === 4 && '📊 Calculez scorul de engagement...'}
                    {stepIndex === 5 && '🎉 Aproape gata!'}
                </p>
            </div>

            <style jsx>{`
        .ai-thinking-container {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .ai-thinking-card {
          background: white;
          border-radius: 24px;
          padding: 2.5rem;
          max-width: 400px;
          width: 90%;
          text-align: center;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          animation: slideUp 0.4s ease;
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .brain-animation {
          position: relative;
          width: 80px;
          height: 80px;
          margin: 0 auto 1.5rem;
        }

        .brain-pulse {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          animation: pulse 2s ease infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.2); opacity: 0.2; }
        }

        .brain-icon {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.5rem;
          animation: bounce 1s ease infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }

        .thinking-content {
          margin-bottom: 1.5rem;
        }

        .thinking-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1a1a2e;
          margin-bottom: 0.5rem;
        }

        .thinking-step {
          color: #667eea;
          font-weight: 500;
          margin-bottom: 1rem;
          min-height: 1.5rem;
        }

        .thinking-progress-container {
          height: 6px;
          background: #e5e7eb;
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 1rem;
        }

        .thinking-progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .step-indicators {
          display: flex;
          justify-content: center;
          gap: 0.5rem;
        }

        .step-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #e5e7eb;
          transition: all 0.3s ease;
        }

        .step-dot.active {
          background: #667eea;
        }

        .step-dot.current {
          transform: scale(1.3);
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.3);
        }

        .thinking-fact {
          font-size: 0.875rem;
          color: #6b7280;
          font-style: italic;
          min-height: 1.25rem;
        }
      `}</style>
        </div>
    );
}
