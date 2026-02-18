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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3 }}
    >
      <Link to={createPageUrl(pageName)}>
        <Card className="overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300" style={{ border: '1px solid #ddd6fe', backgroundColor: '#ffffff' }}>
          <div className="p-6 text-white" style={{ background: 'linear-gradient(135deg, #7c3aed, #4c1d95)' }}>
            <div className="flex items-start justify-between">
              <div className="p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                <Icon className="w-8 h-8" />
              </div>
              <ArrowRight className="w-5 h-5 opacity-70" />
            </div>
            <h3 className="text-xl font-bold mt-4">{title}</h3>
            <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.8)' }}>{description}</p>
          </div>
          
          <CardContent className="p-4" style={{ backgroundColor: '#faf5ff' }}>
            {stats ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2" style={{ color: '#6b7280' }}>
                    <Trophy className="w-4 h-4" style={{ color: '#f59e0b' }} />
                    <span>Melhor Pontuação</span>
                  </div>
                  <span className="font-semibold" style={{ color: '#3b0764' }}>{stats.bestScore || 0}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2" style={{ color: '#6b7280' }}>
                    <Target className="w-4 h-4" style={{ color: '#7c3aed' }} />
                    <span>Melhor Precisão</span>
                  </div>
                  <span className="font-semibold" style={{ color: '#3b0764' }}>{stats.bestAccuracy || 0}%</span>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1" style={{ color: '#9ca3af' }}>
                    <span>Jogos Jogados</span>
                    <span>{stats.gamesPlayed || 0}</span>
                  </div>
                  <Progress value={Math.min((stats.gamesPlayed || 0) * 10, 100)} className="h-1.5" />
                </div>
              </div>
            ) : (
              <p className="text-sm text-center py-2" style={{ color: '#7c3aed' }}>
                Comece a jogar para acompanhar seu progresso
              </p>
            )}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}