import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Info, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import GameHeader from '@/components/games/GameHeader';
import GameSummary from '@/components/games/GameSummary';
import AudioPlayer from '@/components/games/AudioPlayer';
import AnswerOption from '@/components/games/AnswerOption';

const QUESTIONS = [
  {
    id: 1,
    difficulty: 'easy',
    audioDescription: 'Padrão regular tum-tá',
    correctAnswer: 'Bulhas cardíacas normais (B1, B2)',
    options: ['Bulhas cardíacas normais (B1, B2)', 'Sopro sistólico', 'Galope B3'],
    explanation: 'B1 (tum) é causada pelo fechamento das válvulas mitral e tricúspide no início da sístole. B2 (tá) é causada pelo fechamento das válvulas aórtica e pulmonar no final da sístole.',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  {
    id: 2,
    difficulty: 'medium',
    audioDescription: 'Som áspero entre B1 e B2',
    correctAnswer: 'Sopro sistólico',
    options: ['Bulhas cardíacas normais (B1, B2)', 'Sopro sistólico', 'Sopro diastólico'],
    explanation: 'Sopros sistólicos ocorrem entre B1 e B2. Causas comuns incluem estenose aórtica (crescendo-decrescendo), regurgitação mitral (holossistólico) e sopros de fluxo inocentes.',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  },
  {
    id: 3,
    difficulty: 'hard',
    audioDescription: 'Som extra após B2',
    correctAnswer: 'Galope B3',
    options: ['Galope B3', 'Galope B4', 'Estalido de abertura'],
    explanation: 'B3 é um som de baixa frequência no início da diástole causado pelo enchimento ventricular rápido. Em jovens pode ser normal; em adultos mais velhos frequentemente indica insuficiência cardíaca (ritmo de galope: tum-tá-tá).',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
  },
  {
    id: 4,
    difficulty: 'hard',
    audioDescription: 'Som extra antes de B1',
    correctAnswer: 'Galope B4',
    options: ['Galope B3', 'Galope B4', 'Clique sistólico'],
    explanation: 'B4 é um som de baixa frequência no final da diástole, causado pela contração atrial contra um ventrículo rígido. Comum em hipertensão e cardiomiopatia hipertrófica.',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
  },
  {
    id: 5,
    difficulty: 'medium',
    audioDescription: 'Som após B2, seguido de sopro',
    correctAnswer: 'Sopro diastólico',
    options: ['Sopro sistólico', 'Sopro diastólico', 'Atrito pericárdico'],
    explanation: 'Sopros diastólicos ocorrem após B2. São sempre patológicos e podem indicar regurgitação aórtica (sopro decrescendo) ou estenose mitral (ruflar diastólico).',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3'
  },
  {
    id: 6,
    difficulty: 'hard',
    audioDescription: 'Contexto: Paciente com febre e dor torácica que alivia ao inclinar para frente',
    correctAnswer: 'Atrito pericárdico',
    options: ['Atrito pericárdico', 'Sopro sistólico', 'Galope B3'],
    explanation: 'O atrito pericárdico é um som áspero, tipo ranger de couro, ouvido em pericardite. Tem 3 componentes (sístole atrial, sístole ventricular, enchimento ventricular) e melhora com inclinação anterior.',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3'
  },
];

const POINTS_PER_CORRECT = 10;
const BONUS_POINTS = { easy: 0, medium: 5, hard: 10 };

export default function AuscultationCardiaca() {
  const [gameState, setGameState] = useState('playing');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [mistakes, setMistakes] = useState([]);

  const queryClient = useQueryClient();
  const currentQuestion = QUESTIONS[currentIndex];

  const saveProgressMutation = useMutation({
    mutationFn: (data) => base44.entities.GameProgress.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameProgress'] });
    }
  });

  useEffect(() => {
    if (gameState !== 'playing') return;
    const timer = setInterval(() => {
      setTimeElapsed(t => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState]);

  const handleSelectAnswer = (answer) => {
    if (showResult) return;
    setSelectedAnswer(answer);
  };

  const handleSubmit = () => {
    if (!selectedAnswer) return;
    
    setShowResult(true);
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    
    if (isCorrect) {
      const bonus = BONUS_POINTS[currentQuestion.difficulty];
      setScore(prev => prev + POINTS_PER_CORRECT + bonus);
      setCorrectCount(prev => prev + 1);
    } else {
      setMistakes(prev => [...prev, {
        question: currentQuestion.audioDescription,
        user_answer: selectedAnswer,
        correct_answer: currentQuestion.correctAnswer
      }]);
    }
  };

  const handleNext = () => {
    if (currentIndex >= QUESTIONS.length - 1) {
      setGameState('completed');
      const accuracy = Math.round((correctCount / QUESTIONS.length) * 100);
      saveProgressMutation.mutate({
        game_type: 'auscultation_cardiaca',
        score,
        total_possible: QUESTIONS.length * POINTS_PER_CORRECT + 
          QUESTIONS.reduce((sum, q) => sum + BONUS_POINTS[q.difficulty], 0),
        accuracy,
        completion_time: timeElapsed,
        difficulty: 'mixed',
        mistakes,
        completed: true
      });
    } else {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const resetGame = () => {
    setGameState('playing');
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setCorrectCount(0);
    setTimeElapsed(0);
    setMistakes([]);
  };

  const accuracy = currentIndex > 0 ? Math.round((correctCount / currentIndex) * 100) : 100;
  const progress = ((currentIndex + (showResult ? 1 : 0)) / QUESTIONS.length) * 100;

  if (gameState === 'completed') {
    const finalAccuracy = Math.round((correctCount / QUESTIONS.length) * 100);
    return (
      <GameSummary
        score={score}
        totalPossible={QUESTIONS.length * POINTS_PER_CORRECT + 
          QUESTIONS.reduce((sum, q) => sum + BONUS_POINTS[q.difficulty], 0)}
        accuracy={finalAccuracy}
        timeElapsed={timeElapsed}
        mistakes={mistakes}
        onPlayAgain={resetGame}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <GameHeader
        title="Ausculta Cardíaca"
        score={score}
        totalPossible={QUESTIONS.length * POINTS_PER_CORRECT + 
          QUESTIONS.reduce((sum, q) => sum + BONUS_POINTS[q.difficulty], 0)}
        accuracy={accuracy}
        timeElapsed={timeElapsed}
        progress={progress}
      />

      <main className="max-w-2xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-slate-600">
                  Sons Cardíacos
                </Badge>
                <Badge 
                  className={
                    currentQuestion.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-700' :
                    currentQuestion.difficulty === 'medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-rose-100 text-rose-700'
                  }
                >
                  {currentQuestion.difficulty === 'easy' ? 'Fácil' : 
                   currentQuestion.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                  {currentQuestion.difficulty !== 'easy' && (
                    <span className="ml-1">+{BONUS_POINTS[currentQuestion.difficulty]}</span>
                  )}
                </Badge>
              </div>
              <span className="text-sm text-slate-500">
                Questão {currentIndex + 1} de {QUESTIONS.length}
              </span>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-4">
                <Volume2 className="w-5 h-5 text-slate-500" />
                <span className="text-sm font-medium text-slate-700">
                  Ouça o seguinte som
                </span>
              </div>
              <AudioPlayer audioUrl={currentQuestion.audioUrl} />
              
              {currentQuestion.difficulty !== 'easy' && (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-slate-500 mt-0.5" />
                    <p className="text-sm text-slate-600">
                      <span className="font-medium">Contexto Clínico: </span>
                      {currentQuestion.audioDescription}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-700">
                Que tipo de som você ouviu?
              </p>
              {currentQuestion.options.map((option, index) => (
                <AnswerOption
                  key={option}
                  option={option}
                  index={index}
                  isSelected={selectedAnswer === option}
                  isCorrect={option === currentQuestion.correctAnswer}
                  showResult={showResult}
                  onClick={handleSelectAnswer}
                  disabled={showResult}
                />
              ))}
            </div>

            <AnimatePresence>
              {showResult && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white rounded-xl p-4 border border-slate-200"
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      selectedAnswer === currentQuestion.correctAnswer 
                        ? 'bg-emerald-100' 
                        : 'bg-amber-100'
                    }`}>
                      <Info className={`w-4 h-4 ${
                        selectedAnswer === currentQuestion.correctAnswer 
                          ? 'text-emerald-600' 
                          : 'text-amber-600'
                      }`} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-1">
                        {currentQuestion.correctAnswer}
                      </h4>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {currentQuestion.explanation}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-end">
              {!showResult ? (
                <Button
                  onClick={handleSubmit}
                  disabled={!selectedAnswer}
                  className="bg-rose-600 hover:bg-rose-700 px-8"
                >
                  Enviar Resposta
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  className="bg-rose-600 hover:bg-rose-700 px-8"
                >
                  {currentIndex >= QUESTIONS.length - 1 ? 'Ver Resultados' : 'Próxima Questão'}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}