import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import GameHeader from '@/components/games/GameHeader';
import GameSummary from '@/components/games/GameSummary';
import CardiacFociDiagram from '@/components/games/CardiacFociDiagram';
import DraggableLabel from '@/components/games/DraggableLabel';
import FeedbackModal from '@/components/games/FeedbackModal';

const MAX_RETRIES = 2;
const POINTS_PER_CORRECT = 20;

export default function CardiacFociGame() {
  const [gameState, setGameState] = useState('loading');
  const [placedLabels, setPlacedLabels] = useState({});
  const [availableLabels, setAvailableLabels] = useState([]);
  const [draggedLabel, setDraggedLabel] = useState(null);
  const [selectedLabel, setSelectedLabel] = useState(null);
  const [highlightedRegion, setHighlightedRegion] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [retries, setRetries] = useState({});
  const [score, setScore] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [mistakes, setMistakes] = useState([]);

  const queryClient = useQueryClient();

  const { data: regions = [], isLoading } = useQuery({
    queryKey: ['regions', 'cardiac_foci'],
    queryFn: () => base44.entities.GameRegion.filter({ game_type: 'cardiac_foci', active: true }),
  });

  const REGIONS = regions.map(r => r.region_name);
  const FOCI_DATA = regions.reduce((acc, r) => {
    acc[r.region_name] = { explanation: r.explanation };
    return acc;
  }, {});

  const saveProgressMutation = useMutation({
    mutationFn: (data) => base44.entities.GameProgress.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gameProgress'] });
    }
  });

  useEffect(() => {
    if (!isLoading && regions.length > 0 && gameState === 'loading') {
      setAvailableLabels(REGIONS);
      setGameState('playing');
    }
  }, [isLoading, regions, gameState]);

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

  const handleSelectLabel = (label) => {
    setSelectedLabel(prev => prev === label ? null : label);
  };

  const handleDrop = (region, label) => {
    setDraggedLabel(null);
    setHighlightedRegion(null);
    setSelectedLabel(null);

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
  const progress = REGIONS.length > 0 ? (totalPlaced / REGIONS.length) * 100 : 0;

  if (isLoading || gameState === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando jogo...</p>
        </div>
      </div>
    );
  }

  if (regions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-xl p-8 shadow-lg max-w-md">
          <p className="text-slate-700 mb-4">Nenhum foco cardíaco cadastrado ainda.</p>
          <p className="text-sm text-slate-500">Configure os focos no painel administrativo primeiro.</p>
        </div>
      </div>
    );
  }

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
              {typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0)
                ? 'Toque em um foco para selecioná-lo, depois toque na posição correta'
                : 'Arraste os focos para suas posições corretas no tórax'}
            </h2>
            <CardiacFociDiagram
              placedLabels={placedLabels}
              onDrop={handleDrop}
              highlightedRegion={highlightedRegion}
              feedback={feedback}
              selectedLabel={selectedLabel}
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
                  isSelected={selectedLabel === label}
                  onSelect={handleSelectLabel}
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