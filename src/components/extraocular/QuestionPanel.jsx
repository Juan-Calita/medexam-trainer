import React from 'react';
import { MUSCLES } from '@/components/extraocular/muscleData';

export default function QuestionPanel({
  muscles,
  difficulty,
  impairedMuscle,
  selectedAnswer,
  onAnswer,
  gameState,
  onNext,
  feedback,
}) {
  const showCranialNerve = difficulty === 'advanced';

  return (
    <div className="mt-8 w-full max-w-xl">
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-1">
          Questão Clínica
        </p>
        <h2 className="text-lg font-bold text-slate-800 mb-5">
          Qual músculo extraocular está comprometido no olho direito?
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {muscles.map((muscle) => {
            let btnClass = 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300';

            if (selectedAnswer) {
              if (muscle.id === impairedMuscle.id) {
                btnClass = 'border-2 border-green-500 bg-green-50 text-green-800 font-semibold';
              } else if (muscle.id === selectedAnswer && muscle.id !== impairedMuscle.id) {
                btnClass = 'border-2 border-red-400 bg-red-50 text-red-700';
              } else {
                btnClass = 'border border-slate-100 bg-slate-50 text-slate-400';
              }
            }

            return (
              <button
                key={muscle.id}
                onClick={() => onAnswer(muscle.id)}
                disabled={gameState === 'feedback'}
                className={`rounded-lg px-4 py-3 text-sm text-left transition-all duration-150 ${btnClass} disabled:cursor-default`}
              >
                <span className="font-medium">{muscle.name}</span>
                {showCranialNerve && (
                  <span className="block text-xs mt-0.5 opacity-60">{muscle.nerve}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {feedback && (
          <div className={`mt-5 rounded-lg p-4 text-sm leading-relaxed ${feedback.correct ? 'bg-green-50 border border-green-200 text-green-900' : 'bg-red-50 border border-red-200 text-red-900'}`}>
            <p className="font-semibold mb-1">
              {feedback.correct ? '✓ Correto!' : '✗ Incorreto'}
              {!feedback.correct && (
                <span className="ml-2 text-red-700">
                  Resposta correta: <strong>{impairedMuscle.name}</strong>
                </span>
              )}
            </p>
            <p>{impairedMuscle.explanation}</p>
            {showCranialNerve && (
              <p className="mt-2 font-medium text-slate-700">
                Nervo craniano: <span className="text-blue-700">{impairedMuscle.nerve}</span>
              </p>
            )}
          </div>
        )}

        {/* Next button */}
        {gameState === 'feedback' && (
          <button
            onClick={onNext}
            className="mt-4 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors shadow-sm"
          >
            Next Case →
          </button>
        )}
      </div>
    </div>
  );
}