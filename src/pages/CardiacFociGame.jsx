import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import GameHeader from '@/components/games/GameHeader';
import GameSummary from '@/components/games/GameSummary';
import CardiacFociDiagram from '@/components/games/CardiacFociDiagram';
import DraggableLabel from '@/components/games/DraggableLabel';
import FeedbackModal from '@/components/games/FeedbackModal';

const FOCI_DATA = {
  'Foco Aórtico': {
    explanation: 'Localizado no 2° espaço intercostal (EIC) à direita da borda esternal. Principal local para auscultar a válvula aórtica e sopros de estenose aórtica.'
  },
  'Foco Pulmonar': {
    explanation: 'Localizado no 2° EIC à esquerda da borda esternal. Melhor local para auscultar a válvula pulmonar e detectar desdobramento de B2.'
  },
  'Foco Aórtico acessório': {
    explanation: 'Localizado no 3° EIC à esquerda da borda esternal (foco de Erb). Área acessória para auscultar sopros aórticos, especialmente regurgitação aórtica.'
  },
  'Foco Tricúspide': {
    explanation: 'Localizado no 5° EIC à direita do esterno (borda esternal inferior esquerda). Melhor local para auscultar a válvula tricúspide.'
  },
  'Foco Mitral': {
    explanation: 'Localizado no 5° EIC na linha hemiclavicular (ápice cardíaco). Principal local para auscultar a válvula mitral e identificar B1.'
  },
};

const REGIONS = Object.keys(FOCI_DATA);
const MAX_RETRIES = 2;
const POINTS_PER_CORRECT = 20;

export default function CardiacFociGame() {
  const [gameState, setGameState] = useState('playing');
  const [placedLabels, setPlacedLabels] = useState({});
  const [availableLabels, setAvailableLabels] = useState(REGIONS);
  const [draggedLabel, setDraggedLabel] = useState(null);
  const [highlightedRegion, setHighlightedRegion] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [retries, setRetries] = useState({});
  const [score, setScore] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [mistakes, setMistakes] = useState([]);

  const queryClient = useQueryClient();

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

  useEffect(() => {
    const allPlaced = REGIONS.every(region => placedLabels[region]);
    if (allPlaced && gameState === 'playing') {
      setGameState('completed');
      const correctCount = REGIONS.filter(region => placedLabels[region] === region).length;
      const accuracy = Math.round((correctCount / REGIONS.length) * 100);
      saveProgressMutation.mutate({
        game_type: 'cardiac_foci',
        score,
        total_possible: REGIONS.length * POINTS_PER_CORRECT,
        accuracy,
        completion_time: timeElapsed,
        difficulty: 'medium',
        mistakes,
        completed: true
      });
    }
  }, [placedLabels, gameState]);

  const handleDragStart = (label) => {
    setDraggedLabel(label);
  };

  const handleDrop = (region, label) => {
    setDraggedLabel(null);
    setHighlightedRegion(null);

    if (placedLabels[region]) return;

    const isCorrect = region === label;
    const currentRetries = retries[label] || 0;

    if (isCorrect) {
      setPlacedLabels(prev => ({ ...prev, [region]: label }));
      setAvailableLabels(prev => prev.filter(l => l !== label));
      const points = Math.max(POINTS_PER_CORRECT - (currentRetries * 5), 5);
      setScore(prev => prev + points);
      setFeedback({ region, correct: true });
      setShowFeedbackModal(true);
      setTimeout(() => {
        setFeedback(null);
        setShowFeedbackModal(false);
      }, 2000);
    } else {
      if (currentRetries < MAX_RETRIES) {
        setRetries(prev => ({ ...prev, [label]: currentRetries + 1 }));
        setFeedback({ region, correct: false });
        setShowFeedbackModal(true);
        setTimeout(() => {
          setFeedback(null);
          setShowFeedbackModal(false);
        }, 2000);
      } else {
        setMistakes(prev => [...prev, {
          question: `Posicionar ${label}`,
          user_answer: region,
          correct_answer: label
        }]);
        setAvailableLabels(prev => prev.filter(l => l !== label));
      }
    }
  };

  const resetGame = () => {
    setGameState('playing');
    setPlacedLabels({});
    setAvailableLabels(REGIONS);
    setDraggedLabel(null);
    setHighlightedRegion(null);
    setFeedback(null);
    setShowFeedbackModal(false);
    setRetries({});
    setScore(0);
    setTimeElapsed(0);
    setMistakes([]);
  };

  const correctCount = Object.entries(placedLabels).filter(([region, label]) => region === label).length;
  const totalPlaced = Object.keys(placedLabels).length;
  const accuracy = totalPlaced > 0 ? Math.round((correctCount / totalPlaced) * 100) : 100;
  const progress = (totalPlaced / REGIONS.length) * 100;

  if (gameState === 'completed') {
    return (
      <GameSummary
        score={score}
        totalPossible={REGIONS.length * POINTS_PER_CORRECT}
        accuracy={accuracy}
        timeElapsed={timeElapsed}
        mistakes={mistakes}
        onPlayAgain={resetGame}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <GameHeader
        title="Focos de Ausculta Cardíaca"
        score={score}
        totalPossible={REGIONS.length * POINTS_PER_CORRECT}
        accuracy={accuracy}
        timeElapsed={timeElapsed}
        progress={progress}
      />

      <main className="max-w-5xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">
              Arraste os focos para suas posições corretas no tórax
            </h2>
            <CardiacFociDiagram
              placedLabels={placedLabels}
              onDrop={handleDrop}
              highlightedRegion={highlightedRegion}
              feedback={feedback}
            />
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">Focos Disponíveis</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableLabels.map(label => (
                <DraggableLabel
                  key={label}
                  label={label}
                  onDragStart={handleDragStart}
                  isPlaced={Object.values(placedLabels).includes(label)}
                  retries={retries[label] || 0}
                  maxRetries={MAX_RETRIES}
                />
              ))}
            </div>
          </div>

          <AnimatePresence>
            {showFeedbackModal && feedback && (
              <FeedbackModal
                isCorrect={feedback.correct}
                title={feedback.correct ? 'Correto!' : 'Tente Novamente'}
                explanation={feedback.correct ? FOCI_DATA[placedLabels[feedback.region]]?.explanation : 'Esse não é o local correto. Revise a anatomia e tente novamente.'}
                onClose={() => setShowFeedbackModal(false)}
                autoClose={feedback.correct}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
}