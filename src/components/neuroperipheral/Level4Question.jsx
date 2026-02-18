import React, { useState } from 'react';

export default function Level4Question({ currentCase, onAnswer, phase }) {
  const [selDiag, setSelDiag] = useState(null);
  const [selNerve, setSelNerve] = useState(null);
  const [selSite, setSelSite] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  React.useEffect(() => {
    setSelDiag(null);
    setSelNerve(null);
    setSelSite(null);
    setSubmitted(false);
  }, [currentCase.id]);

  const handleSubmit = () => {
    if (!selDiag || !selNerve || !selSite) return;
    const correct =
      selDiag === currentCase.correct_diagnosis &&
      selNerve === currentCase.correct_nerve &&
      selSite === currentCase.correct_site;
    setSubmitted(true);
    onAnswer(correct, { diagnosis: selDiag, nerve: selNerve, site: selSite });
  };

  const optCls = (val, correctVal, selected) => {
    if (phase !== 'feedback') {
      return selected === val
        ? 'border-2 border-red-400 bg-red-50 text-red-800'
        : 'border border-slate-200 bg-white text-slate-700 hover:border-red-200 hover:bg-red-50';
    }
    if (val === correctVal) return 'border-2 border-emerald-500 bg-emerald-50 text-emerald-800';
    if (selected === val) return 'border-2 border-rose-400 bg-rose-50 text-rose-700';
    return 'border border-slate-100 bg-slate-50 text-slate-400';
  };

  const Section = ({ title, options, selected, onSelect, correctVal, tag }) => (
    <div>
      <h3 className="text-sm font-bold text-slate-800 mb-2">{title}</h3>
      <div className="grid grid-cols-1 gap-1.5">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => !submitted && onSelect(opt)}
            disabled={phase === 'feedback'}
            className={`w-full rounded-lg px-3 py-2.5 text-sm text-left font-medium transition-all duration-150 ${optCls(opt, correctVal, selected)} disabled:cursor-default`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-5">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">3 Perguntas Integradas</p>

      <Section
        title="1. Diagnóstico"
        options={currentCase.options_diagnosis}
        selected={selDiag}
        onSelect={setSelDiag}
        correctVal={currentCase.correct_diagnosis}
      />
      <Section
        title="2. Nervo envolvido"
        options={currentCase.options_nerve}
        selected={selNerve}
        onSelect={setSelNerve}
        correctVal={currentCase.correct_nerve}
      />
      <Section
        title="3. Sítio de compressão"
        options={currentCase.options_site}
        selected={selSite}
        onSelect={setSelSite}
        correctVal={currentCase.correct_site}
      />

      {phase === 'question' && !submitted && (
        <button
          onClick={handleSubmit}
          disabled={!selDiag || !selNerve || !selSite}
          className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Confirmar Diagnóstico
        </button>
      )}
    </div>
  );
}