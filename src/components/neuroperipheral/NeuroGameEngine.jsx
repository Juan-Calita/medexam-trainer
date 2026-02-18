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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToMenu}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-700 text-sm font-medium transition-colors"
            >
              ← Níveis
            </button>
            <span className="text-slate-200">|</span>
            <Link
              to={createPageUrl('Home')}
              className="flex items-center gap-1.5 text-slate-500 hover:text-teal-600 text-sm font-medium transition-colors"
            >
              🏠 Home
            </Link>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-base">{config.icon}</span>
            <span className="text-sm font-semibold text-slate-700 hidden sm:inline">{config.title.split('—')[1]?.trim()}</span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {/* Combo */}
            {combo >= 2 && (
              <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                <span className="text-amber-600 font-bold">🔥 x{combo}</span>
              </div>
            )}
            {/* Score */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-xs">Pontos</span>
              <span className="font-bold text-slate-800">{score}</span>
            </div>
            {/* Accuracy */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-xs">Acurácia</span>
              <span className={`font-bold ${accuracy >= 70 ? 'text-emerald-600' : 'text-rose-500'}`}>{accuracy}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Case number */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            Caso #{(caseIndex % queue.length) + 1}
          </span>
          {phase === 'feedback' && lastResult?.correct && (
            <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full border border-emerald-200">
              ✓ Correto
            </span>
          )}
          {phase === 'feedback' && !lastResult?.correct && (
            <span className="text-xs bg-rose-100 text-rose-700 font-semibold px-2 py-0.5 rounded-full border border-rose-200">
              ✗ Incorreto
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Diagram + Clinical Info */}
          <div className="space-y-4">
            {/* Diagram */}
            {level < 4 && (
              <div className="bg-slate-50 rounded-xl border border-slate-100 p-4 flex items-center justify-center min-h-[200px]">
                {renderDiagram()}
              </div>
            )}

            {/* Clinical card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-3">
              <h2 className="text-base font-bold text-slate-800">{currentCase.title}</h2>

              {/* Level 4 scenario */}
              {level === 4 && currentCase.scenario && (
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">Caso Clínico</p>
                  <p className="text-sm text-slate-700 leading-relaxed">{currentCase.scenario}</p>
                </div>
              )}

              <ClinicalRow icon="⚡" label="Déficit Motor" value={currentCase.motor_deficit} />
              <ClinicalRow icon="🌡️" label="Padrão Sensitivo" value={currentCase.sensory_pattern} />
              <ClinicalRow icon="🔨" label="Reflexos" value={currentCase.reflex_change} />
              <ClinicalRow icon="⚙️" label="Mecanismo" value={currentCase.mechanism} />

              {/* Reflex table for level 2 */}
              {level === 2 && currentCase.reflex_table && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Tabela de Reflexos</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {Object.entries(currentCase.reflex_table).map(([reflex, root]) => (
                      <div key={reflex} className={`rounded-lg px-2.5 py-1.5 flex justify-between items-center text-xs ${currentCase.root && root.includes(currentCase.root) ? 'bg-purple-50 border border-purple-200' : 'bg-slate-50 border border-slate-100'}`}>
                        <span className="font-medium text-slate-700">{reflex}</span>
                        <span className={`font-bold ${currentCase.root && root.includes(currentCase.root) ? 'text-purple-700' : 'text-slate-500'}`}>{root}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Question panel */}
          <div>
            {renderQuestion()}

            {/* Explanation on feedback */}
            {phase === 'feedback' && (
              <>
                <div className={`mt-4 rounded-xl p-5 border text-sm leading-relaxed ${lastResult?.correct ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
                  <p className="font-bold mb-2 text-base">
                    {lastResult?.correct ? '✓ Excelente!' : '✗ Revisão Necessária'}
                  </p>
                  <p className="text-slate-700">{currentCase.explanation}</p>
                  {currentCase.next_step && (
                    <div className="mt-3 bg-white bg-opacity-60 rounded-lg px-3 py-2 border border-slate-200">
                      <span className="font-semibold text-slate-700">Próximo passo diagnóstico: </span>
                      <span className="text-blue-700">{currentCase.next_step}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleNext}
                  className="mt-4 w-full py-3 rounded-xl text-white font-bold text-sm tracking-wide shadow-sm transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ backgroundColor: config.color }}
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