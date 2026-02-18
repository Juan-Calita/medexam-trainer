import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Trophy, Target } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { createPageUrl } from '@/utils';

export default function GameCard({ 
  title, 
  description, 
  icon: Icon, 
  pageName, 
  color, 
  stats 
}) {
  const colorClasses = {
    teal: {
      bg: 'bg-gradient-to-br from-teal-400 to-emerald-500',
      light: 'bg-teal-50',
      text: 'text-teal-600',
      border: 'border-teal-200'
    },
    indigo: {
      bg: 'bg-gradient-to-br from-indigo-400 to-purple-500',
      light: 'bg-indigo-50',
      text: 'text-indigo-600',
      border: 'border-indigo-200'
    },
    rose: {
      bg: 'bg-gradient-to-br from-pink-500 to-rose-500',
      light: 'bg-rose-50',
      text: 'text-rose-600',
      border: 'border-rose-200'
    },
    purple: {
      bg: 'bg-gradient-to-br from-purple-500 to-violet-600',
      light: 'bg-purple-50',
      text: 'text-purple-600',
      border: 'border-purple-200'
    }
  };

  const colors = colorClasses[color] || colorClasses.teal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={createPageUrl(pageName)}>
        <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <div className={`${colors.bg} p-6 text-white`}>
            <div className="flex items-start justify-between">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <Icon className="w-8 h-8" />
              </div>
              <ArrowRight className="w-5 h-5 opacity-70" />
            </div>
            <h3 className="text-xl font-bold mt-4">{title}</h3>
            <p className="text-white/80 text-sm mt-1">{description}</p>
          </div>
          
          <CardContent className="p-4">
            {stats ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span>Melhor Pontuação</span>
                  </div>
                  <span className="font-semibold text-slate-800">{stats.bestScore || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Target className="w-4 h-4 text-teal-500" />
                    <span>Melhor Precisão</span>
                  </div>
                  <span className="font-semibold text-slate-800">{stats.bestAccuracy || 0}%</span>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Jogos Jogados</span>
                    <span>{stats.gamesPlayed || 0}</span>
                  </div>
                  <Progress value={Math.min((stats.gamesPlayed || 0) * 10, 100)} className="h-1.5" />
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-2">
                Comece a jogar para acompanhar seu progresso
              </p>
            )}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}