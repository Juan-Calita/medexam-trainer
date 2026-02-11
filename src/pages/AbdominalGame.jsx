import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { DragDropContext } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb } from 'lucide-react';
import GameHeader from '@/components/games/GameHeader';
import GameSummary from '@/components/games/GameSummary';
import AbdominalDiagram from '@/components/games/AbdominalDiagram';
import DraggableLabel from '@/components/games/DraggableLabel';
import FeedbackModal from '@/components/games/FeedbackModal';

const POINTS_PER_CORRECT = 10;
const MAX_RETRIES = 3;

export default function AbdominalGame() {
  const [gameState, setGameState] = useState('loading'); // 'loading' | 'playing' | 'completed'
  const [placedLabels, setPlacedLabels] = useState({});
  const [retries, setRetries] = useState({});
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [draggingLabel, setDraggingLabel] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [feedbackRegion, setFeedbackRegion] = useState(null);
  const [mistakes, setMistakes] = useState([]);

  const queryClient = useQueryClient();

  const { data: regions = [], isLoading } = useQuery({
    queryKey: ['regions', 'abdominal_regions'],
    queryFn: () => base44.entities.GameRegion.filter({ game_type: 'abdominal_regions', active: true }),
  });

  const ALL_LABELS = regions.map(r => r.region_name);
  const REGIONS_DATA = regions.reduce((acc, r) => {
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
      setRetries(Object.fromEntries(ALL_LABELS.map(label => [label, MAX_RETRIES])));
      setGameState('playing');
    }
  }, [isLoading, regions, gameState]);

  // Timer
  useEffect(() => {
    if (gameState !== 'playing') return;
    const timer = setInterval(() => {
      setTimeElapsed(t => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState]);

  // Check completion
  useEffect(() => {
    const allPlaced = ALL_LABELS.every(label => placedLabels[label]);
    const allRetriesUsed = ALL_LABELS.every(label => placedLabels[label] || retries[label] === 0);
    
    if (allPlaced || allRetriesUsed) {
      setGameState('completed');
      const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 0;
      saveProgressMutation.mutate({
        game_type: 'abdominal_regions',
        score,
        total_possible: ALL_LABELS.length * POINTS_PER_CORRECT,
        accuracy,
        completion_time: timeElapsed,
        difficulty: 'easy',
        mistakes,
        completed: true
      });
    }
  }, [placedLabels, retries]);

  const handleDragStart = (label) => {
    setDraggingLabel(label);
  };

  const handleDropZone = useCallback((label, targetRegion) => {
    if (!label || placedLabels[label]) return;
    
    setTotalAttempts(prev => prev + 1);
    
    if (label === targetRegion) {
      // Correct!
      setPlacedLabels(prev => ({ ...prev, [label]: true }));
      setScore(prev => prev + POINTS_PER_CORRECT);
      setCorrectCount(prev => prev + 1);
      setFeedbackRegion({ region: targetRegion, status: 'correct' });
      setFeedback({
        isCorrect: true,
        title: label,
        explanation: REGIONS_DATA[label].explanation
      });
    } else {
      // Incorrect
      setRetries(prev => ({ ...prev, [label]: prev[label] - 1 }));
      setFeedbackRegion({ region: targetRegion, status: 'incorrect' });
      setMistakes(prev => [...prev, {
        question: `Colocar "${label}"`,
        user_answer: targetRegion,
        correct_answer: label
      }]);
      setFeedback({
        isCorrect: false,
        title: `Este é ${targetRegion}`,
        explanation: REGIONS_DATA[targetRegion].explanation
      });
    }
    
    setDraggingLabel(null);
    setTimeout(() => setFeedbackRegion(null), 1500);
  }, [placedLabels]);

  const closeFeedback = () => {
    setFeedback(null);
  };

  const resetGame = () => {
    setGameState('playing');
    setPlacedLabels({});
    setRetries(Object.fromEntries(ALL_LABELS.map(label => [label, MAX_RETRIES])));
    setScore(0);
    setCorrectCount(0);
    setTotalAttempts(0);
    setTimeElapsed(0);
    setMistakes([]);
    setFeedback(null);
    setFeedbackRegion(null);
  };

  const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) : 100;
  const progress = ALL_LABELS.length > 0 ? (Object.keys(placedLabels).length / ALL_LABELS.length) * 100 : 0;

  if (isLoading || gameState === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando jogo...</p>
        </div>
      </div>
    );
  }

  if (regions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-xl p-8 shadow-lg max-w-md">
          <p className="text-slate-700 mb-4">Nenhuma região abdominal cadastrada ainda.</p>
          <p className="text-sm text-slate-500">Configure as regiões no painel administrativo primeiro.</p>
        </div>
      </div>
    );
  }

  if (gameState === 'completed') {
    return (
      <GameSummary
        score={score}
        totalPossible={ALL_LABELS.length * POINTS_PER_CORRECT}
        accuracy={accuracy}
        timeElapsed={timeElapsed}
        mistakes={mistakes}
        onPlayAgain={resetGame}
      />
    );
  }

  const remainingLabels = ALL_LABELS.filter(
    label => !placedLabels[label] && retries[label] > 0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <GameHeader
        title="Regiões Abdominais"
        score={score}
        totalPossible={ALL_LABELS.length * POINTS_PER_CORRECT}
        accuracy={accuracy}
        timeElapsed={timeElapsed}
        progress={progress}
      />

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-3 bg-white border border-slate-200 rounded-xl p-4 mb-6"
        >
          <Lightbulb className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-slate-600">
            <span className="font-medium text-slate-800">Arraste cada rótulo</span> para sua posição 
            anatômica correta no abdome. Você tem {MAX_RETRIES} tentativas por região.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Diagram */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Regiões Abdominais
            </h3>
            <AbdominalDiagram
              placedLabels={placedLabels}
              onDropZone={handleDropZone}
              highlightedRegion={draggingLabel}
              feedbackRegion={feedbackRegion}
            />
          </div>

          {/* Labels */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Rótulos Anatômicos ({remainingLabels.length} restantes)
            </h3>
            <div className="flex flex-wrap gap-2">
              <AnimatePresence mode="popLayout">
                {remainingLabels.map(label => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    layout
                  >
                    <DraggableLabel
                      label={label}
                      isPlaced={placedLabels[label]}
                      retriesLeft={retries[label]}
                      onDragStart={handleDragStart}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {remainingLabels.length === 0 && (
              <p className="text-center text-slate-500 py-8">
                Todos os rótulos foram colocados!
              </p>
            )}
          </div>
        </div>
      </main>

      <FeedbackModal
        isOpen={!!feedback}
        isCorrect={feedback?.isCorrect}
        title={feedback?.title}
        explanation={feedback?.explanation}
        onClose={closeFeedback}
      />
    </div>
  );
}