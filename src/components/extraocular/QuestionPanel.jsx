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
      className="bg-white rounded-2xl p-6 shadow-sm border border-blue-100 h-fit sticky top-24"
    >
      {/* Header */}
      <div className="border-b border-blue-100 pb-4 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <Brain className="w-4 h-4 text-purple-600" />
          <p className="text-xs font-bold text-purple-600 uppercase tracking-widest">
            Questão Clínica
          </p>
        </div>
        {impairedMuscle.scenario && (
          <p className="text-xs text-slate-600 italic bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 mb-2">
            {impairedMuscle.scenario}
          </p>
        )}
        <h2 className="text-base font-bold text-slate-900">
          Qual é o diagnóstico para o olho{' '}
          <span className="text-purple-600">{eyeLabel}</span>?
        </h2>
      </div>

      {/* Answer options */}
      <div className="space-y-2 mb-4">
        {muscles.map((muscle) => {
          let state = 'idle';
          if (selectedAnswer) {
            if (muscle.id === impairedMuscle.id) state = 'correct';
            else if (muscle.id === selectedAnswer) state = 'wrong';
            else state = 'dim';
          }

          const styles = {
            idle: 'border-slate-200 bg-white text-slate-900 hover:border-purple-300 hover:bg-purple-50',
            correct: 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm',
            wrong: 'border-rose-500 bg-rose-50 text-rose-900 shadow-sm',
            dim: 'border-slate-100 bg-slate-50 text-slate-400',
          }[state];

          return (
            <motion.button
              key={muscle.id}
              whileHover={state === 'idle' ? { scale: 1.02 } : {}}
              whileTap={state === 'idle' ? { scale: 0.98 } : {}}
              onClick={() => onAnswer(muscle.id)}
              disabled={gameState === 'feedback'}
              className={`relative w-full rounded-lg border-2 px-4 py-3 text-left transition-all duration-200 disabled:cursor-default text-sm ${styles}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-semibold block">{muscle.name}</span>
                  <span className="text-xs opacity-70 block mt-0.5">{muscle.nerve}</span>
                </div>
                {state === 'correct' && <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />}
                {state === 'wrong' && <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />}
              </div>
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
            className="overflow-hidden mb-4"
          >
            <div className={`rounded-lg p-3 text-xs leading-relaxed border ${
              feedback.correct
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              <p className="font-bold mb-1">
                {feedback.correct ? '✓ Correto!' : '✗ Incorreto'}
                {!feedback.correct && (
                  <span className="ml-2 font-normal">
                    Correto: <strong>{impairedMuscle.name}</strong>
                  </span>
                )}
              </p>
              <p className="opacity-90">{impairedMuscle.explanation}</p>
              {showCranialNerve && (
                <p className="mt-2">
                  Nervo: <span className="font-semibold text-purple-700">{impairedMuscle.nerve}</span>
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Streak progress */}
      {nextDifficulty[difficulty] ? (
        <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg mb-4">
          <span className="text-[10px] text-blue-700 font-semibold">→ {nextDifficulty[difficulty]}:</span>
          <div className="flex gap-1">
            {Array.from({ length: streakToAdvance }).map((_, i) => (
              <motion.div
                key={i}
                animate={{ scale: i < correctStreak ? [1, 1.3, 1] : 1 }}
                transition={{ duration: 0.3 }}
                className={`w-2.5 h-2.5 rounded-full border-2 transition-all ${
                  i < correctStreak
                    ? 'bg-emerald-500 border-emerald-500'
                    : 'bg-transparent border-blue-200'
                }`}
              />
            ))}
          </div>
        </div>
      ) : null}

      {/* Next button */}
      {gameState === 'feedback' && (
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onNext}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-semibold text-sm transition-all shadow-md"
        >
          Próximo Caso <ChevronRight className="w-4 h-4" />
        </motion.button>
      )}
    </motion.div>
  );
}