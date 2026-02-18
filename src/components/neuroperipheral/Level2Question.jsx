import React, { useState } from 'react';

export default function Level2Question({ currentCase, onAnswer, phase }) {
  const [selectedRoot, setSelectedRoot] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  React.useEffect(() => {
    setSelectedRoot(null);
    setSelectedType(null);
    setSubmitted(false);
  }, [currentCase.id]);

  const handleSubmit = () => {
    if (!selectedRoot || !selectedType) return;
    const correct = selectedRoot === currentCase.correct_root && selectedType === currentCase.correct_type;
    setSubmitted(true);
    onAnswer(correct, { root: selectedRoot, type: selectedType });
  };

  const optionCls = (val, correctVal, selected) => {
    if (phase !== 'feedback') {
      return selected === val
        ? 'border-2 border-blue-400 bg-blue-50 text-blue-800'
        : 'border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50';
    }
    if (val === correctVal) return 'border-2 border-emerald-500 bg-emerald-50 text-emerald-800';
    if (selected === val) return 'border-2 border-rose-400 bg-rose-50 text-rose-700';
    return 'border border-slate-100 bg-slate-50 text-slate-400';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Perguntas</p>

      {/* Q1: Root */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-2">1. Qual raiz nervosa está afetada?</h3>
        <div className="grid grid-cols-2 gap-2">
          {currentCase.options_root.map((opt) => (
            <button
              key={opt}
              onClick={() => !submitted && setSelectedRoot(opt)}
              disabled={phase === 'feedback'}
              className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-150 ${optionCls(opt, currentCase.correct_root, selectedRoot)} disabled:cursor-default`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Q2: Type */}
      <div>
        <h3 className="text-sm font-bold text-slate-800 mb-2">2. Tipo de lesão?</h3>
        <div className="grid grid-cols-2 gap-2">
          {currentCase.options_type.map((opt) => (
            <button
              key={opt}
              onClick={() => !submitted && setSelectedType(opt)}
              disabled={phase === 'feedback'}
              className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-150 ${optionCls(opt, currentCase.correct_type, selectedType)} disabled:cursor-default`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      {phase === 'question' && !submitted && (
        <button
          onClick={handleSubmit}
          disabled={!selectedRoot || !selectedType}
          className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Confirmar Resposta
        </button>
      )}
    </div>
  );
}