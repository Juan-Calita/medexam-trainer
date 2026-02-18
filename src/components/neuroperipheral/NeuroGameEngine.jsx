import React, { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { CASES, LEVEL_CONFIG } from './caseDatabase';
import NeuroDiagram from './NeuroDiagram';
import DermatomeMap from './DermatomeMap';
import PlexusDiagram from './PlexusDiagram';
import Level1Question from './Level1Question';
import Level2Question from './Level2Question';
import Level3Question from './Level3Question';
import Level4Question from './Level4Question';

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function NeuroGameEngine({ level, onBackToMenu }) {
  const config = LEVEL_CONFIG[level];
  const allCases = CASES[`level${level}`];

  const [queue, setQueue] = useState(() => shuffle(allCases));
  const [caseIndex, setCaseIndex] = useState(0);
  const [phase, setPhase] = useState('question'); // question | feedback
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(config.attempts);
  const [lastResult, setLastResult] = useState(null); // { correct, answers }

  const currentCase = queue[caseIndex % queue.length];

  const handleAnswer = useCallback((isCorrect, answers) => {
    const newTotal = totalAnswered + 1;
    const newCorrect = totalCorrect + (isCorrect ? 1 : 0);

    if (isCorrect) {
      const multiplier = 1 + Math.min(combo, 4) * 0.5;
      const points = Math.round(100 * multiplier);
      setScore(s => s + points);
      setCombo(c => c + 1);
    } else {
      setCombo(0);
    }

    setTotalAnswered(newTotal);
    setTotalCorrect(newCorrect);
    setLastResult({ correct: isCorrect, answers });
    setPhase('feedback');
  }, [totalAnswered, totalCorrect, combo]);

  const handleNext = useCallback(() => {
    setCaseIndex(i => i + 1);
    setPhase('question');
    setAttemptsLeft(config.attempts);
    setLastResult(null);
  }, [config.attempts]);

  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

  const renderDiagram = () => {
    if (level === 1) return <NeuroDiagram visual={currentCase.visual} limb={currentCase.limb} />;
    if (level === 2) return <DermatomeMap highlightRoot={currentCase.root} limb={currentCase.limb} />;
    if (level === 3) return <PlexusDiagram highlightSegment={phase === 'feedback' ? currentCase.plexus_segment : null} />;
    return null; // Level 4 has scenario text instead
  };

  const renderQuestion = () => {
    const props = { currentCase, onAnswer: handleAnswer, phase, lastResult };
    if (level === 1) return <Level1Question {...props} />;
    if (level === 2) return <Level2Question {...props} />;
    if (level === 3) return <Level3Question {...props} />;
    if (level === 4) return <Level4Question {...props} />;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8f7ff' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b shadow-md" style={{ backgroundColor: '#7c3aed', borderColor: '#6d28d9' }}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBackToMenu}
              className="flex items-center gap-1.5 text-white/90 hover:text-white text-sm font-semibold transition-colors"
            >
              ← Níveis
            </button>
            <span className="text-white/30">|</span>
            <Link
              to={createPageUrl('Home')}
              className="flex items-center gap-1.5 text-white/90 hover:text-white text-sm font-semibold transition-colors"
            >
              🏠 Home
            </Link>
          </div>
          <div className="flex items-center gap-2 text-white">
            <span className="text-xl">{config.icon}</span>
            <span className="font-bold hidden sm:inline">{config.title.split('—')[1]?.trim()}</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-white">
            {combo >= 2 && (
              <div className="px-3 py-1 rounded-full" style={{ backgroundColor: 'rgba(255,193,7,0.2)', border: '1px solid rgba(255,193,7,0.5)' }}>
                <span className="font-bold">🔥 x{combo}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-white/70 text-xs">Pontos:</span>
              <span className="font-bold text-lg">{score}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-white/70 text-xs">Acurácia:</span>
              <span className={`font-bold text-lg ${accuracy >= 70 ? 'text-green-300' : 'text-red-300'}`}>{accuracy}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Case Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#7c3aed' }}>
              Caso #{(caseIndex % queue.length) + 1} / {queue.length}
            </span>
            <h2 className="text-2xl font-bold mt-2" style={{ color: '#1f2937' }}>{currentCase.title}</h2>
          </div>
          <div className="flex items-center gap-3">
            {phase === 'feedback' && lastResult?.correct && (
              <div className="px-4 py-2 rounded-full" style={{ backgroundColor: '#d1fae5', border: '2px solid #10b981' }}>
                <span className="text-sm font-bold text-green-700">✓ Correto!</span>
              </div>
            )}
            {phase === 'feedback' && !lastResult?.correct && (
              <div className="px-4 py-2 rounded-full" style={{ backgroundColor: '#fee2e2', border: '2px solid #ef4444' }}>
                <span className="text-sm font-bold text-red-700">✗ Incorreto</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Diagram + Clinical Info */}
          <div className="lg:col-span-1 space-y-4">
            {/* Diagram */}
            {level < 4 && (
              <div className="rounded-xl border-2 p-6 flex items-center justify-center min-h-[250px]" style={{ backgroundColor: '#faf5ff', borderColor: '#e9d5ff' }}>
                {renderDiagram()}
              </div>
            )}

            {/* Clinical card */}
            <div className="rounded-xl border-2 p-6 space-y-4" style={{ backgroundColor: '#fff', borderColor: '#e5e7eb' }}>
              {/* Level 4 scenario */}
              {level === 4 && currentCase.scenario && (
                <div className="rounded-lg p-4" style={{ backgroundColor: '#e0e7ff', borderLeft: '4px solid #7c3aed' }}>
                  <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: '#7c3aed' }}>Caso Clínico</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{currentCase.scenario}</p>
                </div>
              )}
              <h2 className="text-base font-bold text-slate-800">{currentCase.title}</h2>

              {/* Level 4 scenario */}
              {level === 4 && currentCase.scenario && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Caso Clínico</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{currentCase.scenario}</p>
                </div>
              )}

              <div className="space-y-3 border-t pt-4" style={{ borderColor: '#f3f4f6' }}>
                <ClinicalRow icon="⚡" label="Motor" value={currentCase.motor_deficit} />
                <ClinicalRow icon="🌡️" label="Sensitivo" value={currentCase.sensory_pattern} />
                <ClinicalRow icon="🔨" label="Reflexos" value={currentCase.reflex_change} />
                <ClinicalRow icon="⚙️" label="Mecanismo" value={currentCase.mechanism} />
              </div>

              {/* Reflex table for level 2 */}
              {level === 2 && currentCase.reflex_table && (
                <div className="mt-4 pt-4 border-t" style={{ borderColor: '#f3f4f6' }}>
                  <p className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: '#7c3aed' }}>Reflexos</p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(currentCase.reflex_table).map(([reflex, root]) => (
                      <div 
                        key={reflex} 
                        className="rounded-lg px-3 py-2 text-xs flex justify-between items-center border-2 transition-all"
                        style={{
                          backgroundColor: currentCase.root && root.includes(currentCase.root) ? '#f3e8ff' : '#f9fafb',
                          borderColor: currentCase.root && root.includes(currentCase.root) ? '#ddd6fe' : '#e5e7eb'
                        }}
                      >
                        <span className="font-medium text-slate-700">{reflex}</span>
                        <span className="font-bold" style={{ color: currentCase.root && root.includes(currentCase.root) ? '#7c3aed' : '#9ca3af' }}>{root}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Question panel */}
          <div className="lg:col-span-2">
            {renderQuestion()}

            {/* Explanation on feedback */}
            {phase === 'feedback' && (
              <>
                <div 
                  className="mt-6 rounded-xl p-6 border-2 text-sm leading-relaxed"
                  style={{
                    backgroundColor: lastResult?.correct ? '#ecfdf5' : '#fef2f2',
                    borderColor: lastResult?.correct ? '#10b981' : '#ef4444',
                    color: lastResult?.correct ? '#065f46' : '#7f1d1d'
                  }}
                >
                  <p className="font-bold mb-3 text-base flex items-center gap-2">
                    {lastResult?.correct ? '✓ Excelente!' : '✗ Revisão Necessária'}
                  </p>
                  <p className="mb-4 text-slate-700">{currentCase.explanation}</p>
                  {currentCase.next_step && (
                    <div className="mt-4 pt-4 border-t" style={{ borderColor: lastResult?.correct ? '#a7f3d0' : '#fecaca' }}>
                      <span className="font-semibold">Próximo Passo: </span>
                      <span style={{ color: lastResult?.correct ? '#0891b2' : '#dc2626' }}>{currentCase.next_step}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleNext}
                  className="mt-6 w-full py-3 rounded-xl text-white font-bold text-base tracking-wide shadow-lg transition-all hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                  style={{ backgroundColor: '#7c3aed' }}
                >
                  Próximo Caso →
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ClinicalRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-2.5 text-sm">
      <span className="text-base leading-5 mt-0.5 flex-shrink-0">{icon}</span>
      <div>
        <span className="font-semibold text-slate-600">{label}: </span>
        <span className="text-slate-600">{value}</span>
      </div>
    </div>
  );
}