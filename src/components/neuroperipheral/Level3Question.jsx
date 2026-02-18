import React, { useState } from 'react';

export default function Level3Question({ currentCase, onAnswer, phase }) {
  const [selected, setSelected] = useState(null);

  React.useEffect(() => { setSelected(null); }, [currentCase.id]);

  const handleSelect = (option) => {
    if (phase === 'feedback') return;
    setSelected(option);
    const correct = option === currentCase.correct;
    onAnswer(correct, { segment: option });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">Pergunta</p>
      <h3 className="text-base font-bold text-slate-800 mb-4">
        Qual segmento do plexo está lesado?
      </h3>
      <div className="grid grid-cols-1 gap-2.5">
        {currentCase.options.map((opt) => {
          const isCorrect = opt === currentCase.correct;
          const isSelected = opt === selected;

          let cls = 'border border-slate-200 bg-white text-slate-700 hover:border-amber-300 hover:bg-amber-50';
          if (phase === 'feedback') {
            if (isCorrect) cls = 'border-2 border-emerald-500 bg-emerald-50 text-emerald-800';
            else if (isSelected) cls = 'border-2 border-rose-400 bg-rose-50 text-rose-700';
            else cls = 'border border-slate-100 bg-slate-50 text-slate-400';
          } else if (isSelected) {
            cls = 'border-2 border-amber-400 bg-amber-50 text-amber-800';
          }

          return (
            <button
              key={opt}
              onClick={() => handleSelect(opt)}
              disabled={phase === 'feedback'}
              className={`w-full rounded-lg px-4 py-3 text-sm text-left font-medium transition-all duration-150 ${cls} disabled:cursor-default`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}