import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Eye, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const DIFFICULTIES = [
  { id: 'basic', label: 'Básico', desc: 'Apenas retos horizontais', color: 'text-emerald-400' },
  { id: 'intermediate', label: 'Interm.', desc: '+ Músculos verticais', color: 'text-amber-400' },
  { id: 'advanced', label: 'Avançado', desc: '+ Oblíquos e Nervos Cranianos', color: 'text-rose-400' },
];

export default function ExtraocularHeader({ score, round, difficulty, setDifficulty, gameState }) {
  return (
    <header className="w-full border-b border-slate-700/50 bg-slate-900/95 backdrop-blur-sm sticky top-0 z-30">
      <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Left: back + title */}
        <div className="flex items-center gap-3">
          <Link to={createPageUrl('Home')}>
            <button className="p-2 rounded-lg hover:bg-slate-700/60 text-slate-400 hover:text-slate-200 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <Eye className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-100 leading-tight tracking-tight">
                Músculos Extraoculares
              </h1>
              <p className="text-[10px] text-slate-500 leading-tight">Simulador Clínico</p>
            </div>
          </div>
        </div>

        {/* Center: difficulty */}
        <div className="flex gap-1 bg-slate-800 rounded-lg p-1 border border-slate-700/50">
          {DIFFICULTIES.map(d => (
            <button
              key={d.id}
              onClick={() => setDifficulty(d.id)}
              disabled={gameState !== 'idle'}
              title={d.desc}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                difficulty === d.id
                  ? `bg-slate-700 ${d.color} shadow-sm`
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>

        {/* Right: score + round */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] text-slate-500 uppercase tracking-wider">Pontos</div>
            <motion.div
              key={score}
              initial={{ scale: 1.4, color: '#22d3ee' }}
              animate={{ scale: 1, color: '#f1f5f9' }}
              transition={{ duration: 0.4 }}
              className="text-lg font-bold leading-tight tabular-nums"
            >
              {score}
            </motion.div>
          </div>
          {round > 0 && (
            <div className="text-right">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Rodada</div>
              <div className="text-lg font-bold text-slate-300 leading-tight tabular-nums">{round}</div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}