import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, Target, Clock, AlertTriangle, BookOpen, RotateCcw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { createPageUrl } from '@/utils';

export default function GameSummary({ 
  score, 
  totalPossible, 
  accuracy, 
  timeElapsed, 
  mistakes,
  onPlayAgain 
}) {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getGrade = () => {
    if (accuracy >= 90) return { label: 'Excelente!', color: 'text-emerald-600', bg: 'bg-emerald-100' };
    if (accuracy >= 70) return { label: 'Bom Trabalho!', color: 'text-teal-600', bg: 'bg-teal-100' };
    if (accuracy >= 50) return { label: 'Continue Praticando', color: 'text-amber-600', bg: 'bg-amber-100' };
    return { label: 'Precisa Revisar', color: 'text-rose-600', bg: 'bg-rose-100' };
  };

  const grade = getGrade();

  const reviewTopics = [...new Set(mistakes.map(m => m.correct_answer))];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8"
    >
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className={`inline-flex items-center justify-center w-20 h-20 rounded-full ${grade.bg} mb-4`}
          >
            <Trophy className={`w-10 h-10 ${grade.color}`} />
          </motion.div>
          <h1 className={`text-3xl font-bold ${grade.color}`}>{grade.label}</h1>
          <p className="text-slate-500 mt-2">Jogo Completo</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="bg-white/80 backdrop-blur">
            <CardContent className="p-4 text-center">
              <Trophy className="w-6 h-6 text-amber-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-800">{score}</p>
              <p className="text-xs text-slate-500">de {totalPossible} pontos</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur">
            <CardContent className="p-4 text-center">
              <Target className="w-6 h-6 text-teal-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-800">{accuracy}%</p>
              <p className="text-xs text-slate-500">precisão</p>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur">
            <CardContent className="p-4 text-center">
              <Clock className="w-6 h-6 text-slate-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-slate-800">{formatTime(timeElapsed)}</p>
              <p className="text-xs text-slate-500">tempo</p>
            </CardContent>
          </Card>
        </div>

        {mistakes.length > 0 && (
          <Card className="bg-white/80 backdrop-blur mb-6">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <h3 className="font-semibold text-slate-800">Áreas para Revisar</h3>
              </div>
              <div className="space-y-3">
                {mistakes.slice(0, 5).map((mistake, index) => (
                  <div key={index} className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600">
                      <span className="text-rose-500 line-through">{mistake.user_answer}</span>
                      {' → '}
                      <span className="text-emerald-600 font-medium">{mistake.correct_answer}</span>
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{mistake.question}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {reviewTopics.length > 0 && (
          <Card className="bg-white/80 backdrop-blur mb-8">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-5 h-5 text-teal-500" />
                <h3 className="font-semibold text-slate-800">Tópicos Sugeridos para Revisão</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {reviewTopics.map((topic, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1.5 bg-teal-50 text-teal-700 text-sm rounded-full"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3">
          <Button 
            onClick={onPlayAgain}
            className="flex-1 bg-teal-600 hover:bg-teal-700"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Jogar Novamente
          </Button>
          <Button 
            variant="outline" 
            asChild
            className="flex-1"
          >
            <Link to={createPageUrl('Home')}>
              <Home className="w-4 h-4 mr-2" />
              Início
            </Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
}