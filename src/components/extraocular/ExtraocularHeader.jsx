import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft } from 'lucide-react';

const DIFFICULTIES = [
  { id: 'basic', label: 'Básico', desc: 'Apenas retos horizontais' },
  { id: 'intermediate', label: 'Intermediário', desc: '+ Músculos verticais' },
  { id: 'advanced', label: 'Avançado', desc: '+ Oblíquos e Nervos Cranianos' },
];

export default function ExtraocularHeader({ score, round, difficulty, setDifficulty, gameState }) {
  return (
    <header className="w-full sticky top-0 z-30 shadow-sm" style={{ background: 'linear-gradient(135deg, #2D1B4E 0%, #3D2463 100%)' }}>
      <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <a href="https://www.anamnes.chat/mainpage">
            <button className="p-2 rounded-lg hover:bg-white/10 text-white/60 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </a>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">
              Músculos Extraoculares
            </h1>
            <p className="text-xs text-white/50">Avaliação do Movimento Ocular</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Dificuldade */}
          <div className="flex gap-1 bg-white/10 rounded-lg p-1">
            {DIFFICULTIES.map(d => (
              <button
                key={d.id}
                onClick={() => setDifficulty(d.id)}
                disabled={gameState !== 'idle'}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  difficulty === d.id
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-white/40 hover:text-white/60'
                } disabled:opacity-40 disabled:cursor-not-allowed`}
                title={d.desc}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Pontuação */}
          <div className="text-right">
            <div className="text-xs text-white/50 font-medium">Pontuação</div>
            <div className="text-lg font-bold text-white leading-tight">{score}</div>
          </div>

          {round > 0 && (
            <div className="text-right">
              <div className="text-xs text-white/50 font-medium">Rodada</div>
              <div className="text-lg font-bold text-white/80 leading-tight">{round}</div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}