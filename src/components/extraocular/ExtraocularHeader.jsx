import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft } from 'lucide-react';

const DIFFICULTIES = [
  { id: 'basic', label: 'Basic', desc: 'H & V Recti only' },
  { id: 'intermediate', label: 'Intermediate', desc: '+ Vertical muscles' },
  { id: 'advanced', label: 'Advanced', desc: '+ Obliques & CN' },
];

export default function ExtraocularHeader({ score, round, difficulty, setDifficulty, gameState }) {
  return (
    <header className="w-full border-b border-slate-200 bg-white sticky top-0 z-30">
      <div className="max-w-3xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to={createPageUrl('Home')}>
            <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div>
            <h1 className="text-base font-bold text-slate-800 leading-tight">
              Extraocular Muscle Simulator
            </h1>
            <p className="text-xs text-slate-400">Semiology Training — Eye Movement Assessment</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Difficulty */}
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            {DIFFICULTIES.map(d => (
              <button
                key={d.id}
                onClick={() => setDifficulty(d.id)}
                disabled={gameState !== 'idle'}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  difficulty === d.id
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
                title={d.desc}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Score */}
          <div className="text-right">
            <div className="text-xs text-slate-400 font-medium">Score</div>
            <div className="text-lg font-bold text-blue-700 leading-tight">{score}</div>
          </div>

          {round > 0 && (
            <div className="text-right">
              <div className="text-xs text-slate-400 font-medium">Round</div>
              <div className="text-lg font-bold text-slate-600 leading-tight">{round}</div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}