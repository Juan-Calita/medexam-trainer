import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
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
    audioDescription: 'Som respiratório suave ouvido nos campos pulmonares',
    correctAnswer: 'Murmúrio vesicular',
    options: ['Murmúrio vesicular', 'Broncovesicular', 'Som traqueal'],
    explanation: 'O murmúrio vesicular é o som respiratório normal ouvido na maioria dos campos pulmonares, suave e de baixa frequência durante toda a inspiração.',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  {
    id: 2,
    difficulty: 'easy',
    audioDescription: 'Sons musicais agudos durante a expiração',
    correctAnswer: 'Sibilos',
    options: ['Sibilos', 'Roncos', 'Estridor'],
    explanation: 'Sibilos são sons musicais de alta frequência causados pelo estreitamento das vias aéreas, comuns em asma e DPOC.',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  },
  {
    id: 3,
    difficulty: 'easy',
    audioDescription: 'Sons descontínuos finos tipo estouro',
    correctAnswer: 'Estertores finos',
    options: ['Estertores finos', 'Estertores grossos', 'Roncos'],
    explanation: 'Estertores finos são sons descontínuos de alta frequência, como crepitações, sugerindo fibrose pulmonar ou edema alveolar.',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
  },
  {
    id: 4,
    difficulty: 'medium',
    audioDescription: 'Sons descontínuos grossos tipo bolhas',
    correctAnswer: 'Estertores grossos',
    options: ['Estertores grossos', 'Estertores finos', 'Roncos'],
    explanation: 'Estertores grossos são sons mais graves e úmidos, indicando secreções nas vias aéreas maiores, comuns em pneumonia ou insuficiência cardíaca.',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
  },
  {
    id: 5,
    difficulty: 'medium',
    audioDescription: 'Sons contínuos graves tipo ronco',
    correctAnswer: 'Roncos',
    options: ['Roncos', 'Sibilos', 'Estertores grossos'],
    explanation: 'Roncos são sons contínuos de baixa frequência por secreções nas vias aéreas. Frequentemente desaparecem com a tosse.',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3'
  },
  {
    id: 6,
    difficulty: 'medium',
    audioDescription: 'Som inspiratório agudo em vias aéreas superiores',
    correctAnswer: 'Estridor',
    options: ['Estridor', 'Sibilos', 'Grasmido'],
    explanation: 'Estridor é um som agudo inspiratório indicando obstrução das vias aéreas superiores, uma emergência médica.',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3'
  },
  {
    id: 7,
    difficulty: 'medium',
    audioDescription: 'Som de ranger/fricção durante respiração',
    correctAnswer: 'Atrito pleural',
    options: ['Atrito pleural', 'Estertores grossos', 'Roncos'],
    explanation: 'Atrito pleural é um som áspero tipo ranger, causado pela fricção entre pleuras inflamadas. Ouvido na inspiração e expiração.',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3'
  },
  {
    id: 8,
    difficulty: 'hard',
    audioDescription: 'Som entre traqueal e vesicular, ouvido próximo ao esterno',
    correctAnswer: 'Broncovesicular',
    options: ['Broncovesicular', 'Murmúrio vesicular', 'Som traqueal'],
    explanation: 'Som broncovesicular é ouvido normalmente entre as escápulas e próximo ao esterno, com inspiração e expiração similares.',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3'
  },
  {
    id: 9,
    difficulty: 'hard',
    audioDescription: 'Som respiratório alto e áspero sobre a traqueia',
    correctAnswer: 'Som traqueal',
    options: ['Som traqueal', 'Broncovesicular', 'Estridor'],
    explanation: 'Som traqueal é ouvido sobre a traqueia, alto e áspero, com expiração mais longa que inspiração.',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3'
  },
  {
    id: 10,
    difficulty: 'hard',
    audioDescription: 'Voz sussurrada audível claramente através do tórax',
    correctAnswer: 'Pectoriloquia',
    options: ['Pectoriloquia', 'Egofonia', 'Som vocal normal'],
    explanation: 'Pectoriloquia é a transmissão aumentada de sussurros através de tecido pulmonar consolidado, sinal de pneumonia.',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3'
  },
  {
    id: 11,
    difficulty: 'hard',
    audioDescription: 'Voz com qualidade nasal tipo "a" virando "e"',
    correctAnswer: 'Egofonia',
    options: ['Egofonia', 'Pectoriloquia', 'Egofonia normal'],
    explanation: 'Egofonia é quando "a" soa como "e" na ausculta, indicando consolidação ou derrame pleural.',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3'
  },
  {
    id: 12,
    difficulty: 'easy',
    audioDescription: 'Transmissão vocal normal através do tórax',
    correctAnswer: 'Som vocal normal',
    options: ['Som vocal normal', 'Pectoriloquia', 'Egofonia'],
    explanation: 'Som vocal normal é a transmissão diminuída e abafada da voz através do pulmão saudável.',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3'
  },
  {
    id: 13,
    difficulty: 'hard',
    audioDescription: 'Voz sem alteração patológica',
    correctAnswer: 'Egofonia normal',
    options: ['Egofonia normal', 'Egofonia', 'Pectoriloquia'],
    explanation: 'Egofonia normal é a ressonância vocal preservada sem qualidade nasal ou alterações.',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3'
  },
  {
    id: 14,
    difficulty: 'medium',
    audioDescription: 'Som agudo parecido com miado de gato',
    correctAnswer: 'Grasmido',
    options: ['Grasmido', 'Estridor', 'Sibilos'],
    explanation: 'Grasmido é um som agudo, semelhante ao miado de gato, indicando obstrução laríngea ou de cordas vocais.',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3'
  },
];

const POINTS_PER_CORRECT = 10;
const BONUS_POINTS = { easy: 0, medium: 5, hard: 10 };

export default function AuscultationPulmonar() {
  const [gameState, setGameState] = useState('playing');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [mistakes, setMistakes] = useState([]);

  const queryClient = useQueryClient();

  const { data: audioFiles = [] } = useQuery({
    queryKey: ['audioFiles', 'auscultation_pulmonar'],
    queryFn: () => base44.entities.AudioFile.filter({ game_type: 'auscultation_pulmonar' }),
  });

  const questionsWithAudio = QUESTIONS.map(q => {
    const audioFile = audioFiles.find(a => a.sound_type === q.correctAnswer);
    return {
      ...q,
      audioUrl: audioFile?.file_url || q.audioUrl
    };
  });

  const currentQuestion = questionsWithAudio[currentIndex];

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
        game_type: 'auscultation_pulmonar',
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
        title="Ausculta Pulmonar"
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
                  Sons Pulmonares
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
                  className="bg-teal-600 hover:bg-teal-700 px-8"
                >
                  Enviar Resposta
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  className="bg-teal-600 hover:bg-teal-700 px-8"
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