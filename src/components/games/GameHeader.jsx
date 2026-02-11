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
    <div className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <Link 
            to={createPageUrl('Home')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Sair</span>
          </Link>
          <h1 className="text-lg font-semibold text-slate-800">{title}</h1>
          <div className="w-16" />
        </div>
        
        <div className="flex items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-slate-600">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="font-medium">{score}</span>
              <span className="text-slate-400">/ {totalPossible}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <Target className="w-4 h-4 text-teal-500" />
              <span className="font-medium">{accuracy}%</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>{formatTime(timeElapsed)}</span>
            </div>
          </div>
        </div>
        
        <Progress value={progress} className="h-1.5 mt-3" />
      </div>
    </div>
  );
}