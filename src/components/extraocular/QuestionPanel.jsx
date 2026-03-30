import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, ChevronRight, Brain } from 'lucide-react';

export default function QuestionPanel({
  muscles,
  difficulty,
  impairedMuscle,
  impairedEye,
  selectedAnswer,
  onAnswer,
  gameState,
  onNext,
  feedback,
  correctStreak,
  streakToAdvance,
}) {
  const showCranialNerve = difficulty === 'advanced';
  const eyeLabel = impairedEye === 'left' ? 'esquerdo' : 'direito';
  const nextDifficulty = { basic: 'Intermediário', intermediate: 'Avançado', advanced: null };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mt-6 w-full max-w-xl"
    >
      <div className="bg-slate-800/80 backdrop-blur border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl shadow-black/30">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-slate-700/50">
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-3.5 h-3.5 text-cyan-400" />
            <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
              Questão Clínica
            </p>
          </div>
          {impairedMuscle.scenario && (
            <p className="text-xs text-slate-400 italic bg-slate-900/40 border border-slate-700/40 rounded-lg px-3 py-2 mt-2 mb-3 leading-relaxed">
              {impairedMuscle.scenario}
            </p>
          )}
          <h2 className="text-base font-bold text-slate-100">
            Qual é o diagnóstico para o olho{' '}
            <span className="text-cyan-300">{eyeLabel}</span>?
          </h2>
        </div>

        {/* Answer grid */}
        <div className="p-5 grid grid-cols-2 gap-2.5">
          {muscles.map((muscle) => {
            let state = 'idle';
            if (selectedAnswer) {
              if (muscle.id === impairedMuscle.id) state = 'correct';
              else if (muscle.id === selectedAnswer) state = 'wrong';
              else state = 'dim';
            }

            const styles = {
              idle: 'border-slate-700/60 bg-slate-900/40 text-slate-200 hover:border-cyan-500/50 hover:bg-cyan-500/5 hover:text-cyan-100',
              correct: 'border-emerald-500 bg-emerald-500/10 text-emerald-300',
              wrong: 'border-rose-500 bg-rose-500/10 text-rose-300',
              dim: 'border-slate-700/30 bg-slate-900/20 text-slate-600',
            }[state];

            return (
              <motion.button
                key={muscle.id}
                whileHover={state === 'idle' ? { scale: 1.02 } : {}}
                whileTap={state === 'idle' ? { scale: 0.98 } : {}}
                onClick={() => onAnswer(muscle.id)}
                disabled={gameState === 'feedback'}
                className={`relative rounded-xl border px-4 py-3 text-left transition-all duration-200 disabled:cursor-default group ${styles}`}
              >
                {state === 'correct' && (
                  <CheckCircle2 className="absolute top-2 right-2 w-4 h-4 text-emerald-400" />
                )}
                {state === 'wrong' && (
                  <XCircle className="absolute top-2 right-2 w-4 h-4 text-rose-400" />
                )}
                <span className="font-semibold text-sm block leading-snug">{muscle.name}</span>
                <span className="text-[11px] opacity-60 mt-0.5 block">{muscle.nerve}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Feedback explanation */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className={`mx-5 mb-4 rounded-xl p-4 text-sm leading-relaxed border ${
                feedback.correct
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
              }`}>
                <p className="font-bold mb-1 text-[13px]">
                  {feedback.correct ? '✓ Correto!' : '✗ Incorreto'}
                  {!feedback.correct && (
                    <span className="ml-2 font-normal text-rose-300">
                      Correto: <strong className="text-rose-100">{impairedMuscle.name}</strong>
                    </span>
                  )}
                </p>
                <p className="opacity-90 text-xs leading-relaxed">{impairedMuscle.explanation}</p>
                {showCranialNerve && (
                  <p className="mt-2 text-xs">
                    Nervo:{' '}
                    <span className="text-cyan-300 font-semibold">{impairedMuscle.nerve}</span>
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Streak + Next */}
        <div className="px-5 pb-5 flex items-center justify-between gap-3">
          {/* Streak dots */}
          {nextDifficulty[difficulty] ? (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-500">→ {nextDifficulty[difficulty]}:</span>
              <div className="flex gap-1">
                {Array.from({ length: streakToAdvance }).map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ scale: i < correctStreak ? [1, 1.3, 1] : 1 }}
                    transition={{ duration: 0.3 }}
                    className={`w-3 h-3 rounded-full border transition-all ${
                      i < correctStreak
                        ? 'bg-emerald-400 border-emerald-400'
                        : 'bg-transparent border-slate-600'
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div />
          )}

          {/* Next button */}
          {gameState === 'feedback' && (
            <motion.button
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={onNext}
              className="flex items-center gap-2 px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 rounded-xl font-bold text-sm transition-colors shadow-lg shadow-cyan-500/20"
            >
              Próximo <ChevronRight className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}