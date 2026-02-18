import React from 'react';
import { LEVEL_CONFIG } from './caseDatabase';

export default function NeuroMenuScreen({ onSelectLevel }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f8f7ff' }}>
      {/* Hero */}
      <div className="text-white px-6 py-16 text-center" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)' }}>
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-widest mb-6 text-white/90 border border-white/25 backdrop-blur-sm">
            🧠 Módulo Avançado de Neurologia
          </div>
          <h1 className="text-5xl sm:text-5xl font-black mb-4 leading-tight tracking-tight">
            NeuroPeripheral Master
          </h1>
          <p className="text-white/80 text-lg leading-relaxed max-w-2xl mx-auto font-light">
            Nervos Periféricos · Dermátomos · Plexo Braquial · Radiculopatias · Síndromes de Compressão
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {['4 Níveis', 'Casos Aleatórios', 'Feedback Imediato', 'Combo x4'].map((tag) => (
              <div key={tag} className="px-4 py-2 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                <span className="text-sm font-semibold text-white/90">{tag}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-12">
        {/* Section Title */}
        <div className="mb-8">
          <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#7c3aed' }}>Escolha seu Desafio</span>
          <h2 className="text-3xl font-bold mt-2 mb-1" style={{ color: '#2e1065' }}>Selecione o Nível</h2>
          <p className="text-slate-600 text-sm">Comece no nível iniciante ou desafie-se com casos avançados</p>
        </div>

        {/* Level cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          {[1, 2, 3, 4].map((level) => {
            const cfg = LEVEL_CONFIG[level];
            return (
              <button
                key={level}
                onClick={() => onSelectLevel(level)}
                className="group text-left overflow-hidden rounded-2xl border-2 p-6 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 active:scale-[0.98]"
                style={{ 
                  borderColor: cfg.color,
                  background: `linear-gradient(135deg, ${cfg.bgColor} 0%, ${cfg.bgColor}dd 100%)`,
                  boxShadow: '0 4px 20px rgba(124, 58, 237, 0.1)'
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <span className="text-4xl">{cfg.icon}</span>
                  <div className="px-3 py-1 rounded-lg" style={{ backgroundColor: 'rgba(255,255,255,0.9)', color: cfg.color }}>
                    <span className="text-xs font-bold">Nível {level}</span>
                  </div>
                </div>
                <h3 className="font-bold text-lg mb-2" style={{ color: '#1f2937' }}>
                  {cfg.title.split('—')[1]?.trim() || cfg.title}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-4">{cfg.subtitle}</p>

                <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'rgba(0,0,0,0.1)' }}>
                  <div className="flex gap-2">
                    {Array.from({ length: level }).map((_, i) => (
                      <div 
                        key={i} 
                        className="w-2.5 h-2.5 rounded-full" 
                        style={{ backgroundColor: cfg.color, opacity: 0.6 + i * 0.1 }}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-bold group-hover:translate-x-1 transition-transform" style={{ color: cfg.color }}>
                    Iniciar →
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Features */}
        <div className="rounded-2xl p-8 border-2" style={{ backgroundColor: '#faf5ff', borderColor: '#e9d5ff' }}>
          <h3 className="text-lg font-bold mb-6" style={{ color: '#6d28d9' }}>⚡ Recursos</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: '🎯', title: 'Casos Aleatórios', desc: 'Nova experiência a cada sessão' },
              { icon: '🔥', title: 'Combo Multiplier', desc: 'Ganhe mais pontos com acertos consecutivos' },
              { icon: '📊', title: 'Analytics Detalhado', desc: 'Acompanhe seu progresso em tempo real' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="text-center">
                <span className="text-3xl block mb-2">{icon}</span>
                <h4 className="font-bold text-sm mb-1" style={{ color: '#1f2937' }}>{title}</h4>
                <p className="text-xs text-slate-600">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}