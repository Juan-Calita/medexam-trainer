import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Target, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function StatsOverview({ progressData }) {
  const totalGames = progressData.length;
  const avgAccuracy = totalGames > 0 
    ? Math.round(progressData.reduce((sum, p) => sum + (p.accuracy || 0), 0) / totalGames)
    : 0;
  const totalPoints = progressData.reduce((sum, p) => sum + (p.score || 0), 0);
  const avgTime = totalGames > 0
    ? Math.round(progressData.reduce((sum, p) => sum + (p.completion_time || 0), 0) / totalGames)
    : 0;

  const stats = [
    { 
      label: 'Total de Pontos', 
      value: totalPoints, 
      icon: Trophy, 
      color: 'text-amber-500',
      bg: 'bg-amber-50'
    },
    { 
      label: 'Precisão Média', 
      value: `${avgAccuracy}%`, 
      icon: Target, 
      color: 'text-teal-500',
      bg: 'bg-teal-50'
    },
    { 
      label: 'Jogos Jogados', 
      value: totalGames, 
      icon: TrendingUp, 
      color: 'text-indigo-500',
      bg: 'bg-indigo-50'
    },
    { 
      label: 'Tempo Médio', 
      value: `${Math.floor(avgTime / 60)}:${(avgTime % 60).toString().padStart(2, '0')}`, 
      icon: Clock, 
      color: 'text-slate-500',
      bg: 'bg-slate-50'
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-bold text-slate-800">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}