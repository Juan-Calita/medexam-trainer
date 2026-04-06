import React from 'react';
import { Gamepad2, Clock, Trophy, Target } from 'lucide-react';
import { formatTime } from '@/lib/analyticsUtils';

export default function StatsCards({ stats }) {
  const cards = [
    { label: 'Total de Jogos', value: stats.total, icon: Gamepad2, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Tempo Total', value: formatTime(stats.totalTime), icon: Clock, color: 'text-teal-600', bg: 'bg-teal-50' },
    { label: 'Pontuação Total', value: stats.totalScore, icon: Trophy, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Precisão Média', value: `${stats.avgAccuracy}%`, icon: Target, color: 'text-rose-600', bg: 'bg-rose-50' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map(c => (
        <div key={c.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${c.bg} flex items-center justify-center flex-shrink-0`}>
            <c.icon className={`w-5 h-5 ${c.color}`} />
          </div>
          <div>
            <p className="text-xs text-slate-500">{c.label}</p>
            <p className="text-lg font-bold text-slate-800">{c.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}