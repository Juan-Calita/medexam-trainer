import React from 'react';
import { LEVEL_CONFIG } from './caseDatabase';

export default function NeuroMenuScreen({ onSelectLevel }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f0eeff' }}>
      {/* Hero */}
      <div className="text-white px-6 py-12 text-center" style={{ background: 'linear-gradient(to right bottom, #7c3aed, #6d28d9)' }}>
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-widest mb-6 text-slate-300 border border-white/20">
            🧠 Módulo de Treinamento Médico
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3 leading-tight">
            NeuroPeripheral Master
          </h1>
          <p className="text-slate-300 text-base leading-relaxed max-w-xl mx-auto">
            Nervos Periféricos · Dermátomos · Plexo Braquial · Lombossacral · Radiculopatias · Síndromes de Compressão
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs text-slate-400">
            <span className="bg-white/10 rounded-full px-3 py-1">4 Níveis Progressivos</span>
            <span className="bg-white/10 rounded-full px-3 py-1">Casos Aleatorizados</span>
            <span className="bg-white/10 rounded-full px-3 py-1">Feedback Imediato</span>
            <span className="bg-white/10 rounded-full px-3 py-1">Combo Multiplier</span>
          </div>
        </div>
      </div>

      {/* Level cards */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-10">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-5 text-center">
          Selecione o Nível
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((level) => {
            const cfg = LEVEL_CONFIG[level];
            return (
              <button
                key={level}
                onClick={() => onSelectLevel(level)}
                className="group text-left rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.98]"
                style={{ borderColor: cfg.borderColor, backgroundColor: cfg.bgColor }}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl">{cfg.icon}</span>
                  <span
                    className="text-xs font-bold rounded-full px-2.5 py-1 border"
                    style={{ color: cfg.color, borderColor: cfg.borderColor, backgroundColor: 'white' }}
                  >
                    Nível {level}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 text-base leading-snug mb-1">
                  {cfg.title.split('—')[1]?.trim() || cfg.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">{cfg.subtitle}</p>

                <div className="mt-4 flex items-center justify-between">
                  <div className="flex gap-1.5">
                    {Array.from({ length: level }).map((_, i) => (
                      <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cfg.color, opacity: 0.7 + i * 0.1 }}/>
                    ))}
                  </div>
                  <span className="text-xs font-semibold group-hover:translate-x-1 transition-transform" style={{ color: cfg.color }}>
                    Iniciar →
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Info */}
        <div className="mt-8 bg-slate-50 rounded-xl border border-slate-100 p-5">
          <h3 className="text-sm font-bold text-slate-700 mb-3">📋 Como funciona</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
            {[
              ['🎯', 'Casos aleatorizados a cada sessão'],
              ['⚡', 'Déficit motor + padrão sensitivo + reflexos'],
              ['🔥', 'Combo multiplier para acertos consecutivos'],
              ['📚', 'Explicação clínica detalhada após cada caso'],
              ['🏥', 'Preparação para residência médica'],
              ['🧠', 'Diagnóstico integrado no Nível 4'],
            ].map(([icon, text]) => (
              <div key={text} className="flex items-start gap-2" style={{ color: '#4b5563' }}>
                <span className="flex-shrink-0">{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}