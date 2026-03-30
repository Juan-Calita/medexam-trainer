import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock, Target, Trophy } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { createPageUrl } from '@/utils';

export default function GameHeader({ 
  title, 
  score, 
  totalPossible, 
  accuracy, 
  timeElapsed, 
  progress 
}) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="sticky top-0 z-40 shadow-sm" style={{ background: 'linear-gradient(135deg, #2D1B4E 0%, #3D2463 100%)' }}>
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <Link 
            to={createPageUrl('Home')}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Sair</span>
          </Link>
          <h1 className="text-lg font-semibold text-white">{title}</h1>
          <div className="w-16" />
        </div>
        
        <div className="flex items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-white/80">
              <Trophy className="w-4 h-4 text-amber-300" />
              <span className="font-medium">{score}</span>
              <span className="text-white/50">/ {totalPossible}</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/80">
              <Target className="w-4 h-4 text-cyan-300" />
              <span className="font-medium">{accuracy}%</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/80">
              <Clock className="w-4 h-4 text-white/50" />
              <span>{formatTime(timeElapsed)}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-3 bg-white/10 rounded-full h-1.5 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-purple-400 to-cyan-400 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}