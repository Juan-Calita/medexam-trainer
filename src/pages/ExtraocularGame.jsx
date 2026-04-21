import React, { useState, useRef, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { getClientIPIfAnonymous } from '@/lib/getClientIP';
import { useMutation } from '@tanstack/react-query';
import EyeCanvas from '@/components/extraocular/EyeCanvas';
import QuestionPanel from '@/components/extraocular/QuestionPanel';
import GameHeader from '@/components/extraocular/ExtraocularHeader';
import FeedbackPopup from '@/components/extraocular/FeedbackPopup';
import PenTracker from '@/components/extraocular/PenTracker';
import { MUSCLES, getMusclesForDifficulty, getImpairedMovement } from '@/components/extraocular/muscleData';
import { Mouse, Camera, Square, Box } from 'lucide-react';
import EyeCanvas3D from '@/components/extraocular/EyeCanvas3D';

export default function ExtraocularGame() {
  const [difficulty, setDifficulty] = useState('basic');
  const [gameState, setGameState] = useState('idle'); // idle | playing | feedback
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [impairedMuscle, setImpairedMuscle] = useState(null);
  const [impairedEye, setImpairedEye] = useState('right');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [feedback, setFeedback] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [muscleHistory, setMuscleHistory] = useState({});
  const [inputMode, setInputMode] = useState('mouse'); // 'mouse' | 'camera'
  const [viewMode, setViewMode] = useState('2d'); // '2d' | '3d'
  const [showCameraPanel, setShowCameraPanel] = useState(false);
  const [totalAnswered, setTotalAnswered] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const containerRef = useRef(null);

  const saveProgressMutation = useMutation({
    mutationFn: (data) => base44.entities.GameProgress.create(data),
  });

  // Timer
  useEffect(() => {
    if (gameState !== 'playing') return;
    const timer = setInterval(() => setTimeElapsed(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, [gameState]);

  const DIFFICULTY_LEVELS = ['basic', 'intermediate', 'advanced'];
  const STREAK_TO_ADVANCE = 3;

  const handleMouseMove = useCallback((e) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  }, []);

  const startNewRound = useCallback(() => {
    const available = getMusclesForDifficulty(difficulty);
    const historyForLevel = muscleHistory[difficulty] || {};
    const filtered = available.filter((m) => (historyForLevel[m.id] || 0) < 2);
    const pool = filtered.length > 0 ? filtered : available;
    const muscle = pool[Math.floor(Math.random() * pool.length)];
    setMuscleHistory((prev) => {
      const levelHistory = { ...(prev[difficulty] || {}) };
      if (filtered.length === 0) {
        // reset counts when all hit the limit
        return { ...prev, [difficulty]: { [muscle.id]: 1 } };
      }
      levelHistory[muscle.id] = (levelHistory[muscle.id] || 0) + 1;
      return { ...prev, [difficulty]: levelHistory };
    });
    const eye = Math.random() > 0.5 ? 'left' : 'right';
    setImpairedMuscle(muscle);
    setImpairedEye(eye);
    setGameState('playing');
    setFeedback(null);
    setSelectedAnswer(null);
    setRound((r) => r + 1);
    setShowCameraPanel(false);
  }, [difficulty, muscleHistory]);

  const handleAnswer = useCallback((muscleId) => {
    if (gameState !== 'playing') return;
    const correct = muscleId === impairedMuscle.id;
    setSelectedAnswer(muscleId);
    setFeedback({ correct, muscle: impairedMuscle, chosenId: muscleId });
    if (correct) {
      setScore((s) => s + 1);
      setTotalCorrect(c => c + 1);
      setCorrectStreak((prev) => {
        const newStreak = prev + 1;
        if (newStreak >= STREAK_TO_ADVANCE) {
          const currentIndex = DIFFICULTY_LEVELS.indexOf(difficulty);
          if (currentIndex < DIFFICULTY_LEVELS.length - 1) {
            setDifficulty(DIFFICULTY_LEVELS[currentIndex + 1]);
          }
          return 0;
        }
        return newStreak;
      });
    } else {
      setCorrectStreak(0);
    }
    setTotalAnswered(t => {
      const newTotal = t + 1;
      // Save every 10 rounds
      if (newTotal > 0 && newTotal % 10 === 0) {
        const acc = Math.round(((totalCorrect + (muscleId === impairedMuscle.id ? 1 : 0)) / newTotal) * 100);
        getClientIPIfAnonymous().then(ip => {
          saveProgressMutation.mutate({
            game_type: 'extraocular',
            score,
            total_possible: newTotal * 1,
            accuracy: acc,
            completion_time: timeElapsed,
            difficulty,
            completed: false,
            ...(ip ? { ip_address: ip } : {})
          });
        });
      }
      return newTotal;
    });
    setGameState('feedback');
  }, [gameState, impairedMuscle, difficulty, correctStreak, score, totalCorrect, timeElapsed]);

  const handleNext = useCallback(() => {
    startNewRound();
  }, [startNewRound]);

  const availableMuscles = getMusclesForDifficulty(difficulty);

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-50 flex flex-col items-center"
      onMouseMove={inputMode === 'mouse' ? handleMouseMove : undefined}
      ref={containerRef}>
      
      {/* Header */}
      <GameHeader score={score} round={round} difficulty={difficulty} setDifficulty={setDifficulty} gameState={gameState} />

      {/* Mode selector */}
      {/* Beta warning badges */}
      <div className="fixed top-24 right-4 z-50 flex flex-col gap-2 max-w-[220px]">
        {inputMode === 'camera' && (
        <div className="fixed top-24 right-4 z-50 flex items-start gap-2 bg-amber-50 border border-amber-300 text-amber-800 text-xs font-medium px-3 py-2 rounded-lg shadow-sm max-w-[220px]">
          <span className="text-base mt-0.5">🧪</span>
          <span><strong>Modo teste:</strong> ainda em desenvolvimento, pode haver irregularidades. Recalibragens durante o uso podem ser necessárias.</span>
        </div>
        )}
        {viewMode === '3d' && (
          <div className="flex items-start gap-2 bg-indigo-50 border border-indigo-300 text-indigo-800 text-xs font-medium px-3 py-2 rounded-lg shadow-sm">
            <span className="text-base mt-0.5">🎮</span>
            <span><strong>Modo 3D beta:</strong> visual em desenvolvimento. A mecânica e a resposta correta seguem a mesma lógica do 2D.</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mt-6 bg-white rounded-full p-1 shadow-sm border border-slate-200">
        <button
          onClick={() => setInputMode('mouse')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
          inputMode === 'mouse' ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`
          }>
          
          <Mouse className="w-4 h-4" />
          Mouse
        </button>
        <button
          onClick={() => { setInputMode('camera'); setShowCameraPanel(true); }}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${inputMode === 'camera' ? 'bg-gradient-to-r from-cyan-600 to-cyan-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
          <Camera className="w-4 h-4" />
          Câmera (caneta azul)
        </button>
      </div>

      {/* 2D / 3D toggle */}
      <div className="flex items-center gap-2 mt-2 bg-white rounded-full p-1 shadow-sm border border-slate-200">
        <button
          onClick={() => setViewMode('2d')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            viewMode === '2d' ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Square className="w-4 h-4" />
          2D
        </button>
        <button
          onClick={() => setViewMode('3d')}
          className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
            viewMode === '3d' ? 'bg-gradient-to-r from-cyan-600 to-cyan-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Box className="w-4 h-4" />
          3D Beta
        </button>
      </div>

      {/* Face + Eyes */}
      <div className="flex flex-col items-center mt-4 w-full max-w-2xl px-4">
        {viewMode === '2d' ? (
          <EyeCanvas
            mousePos={mousePos}
            containerRef={containerRef}
            impairedMuscle={gameState === 'playing' || gameState === 'feedback' ? impairedMuscle : null}
            impairedEye={impairedEye}
            gameState={gameState}
            inputMode={inputMode}
          />
        ) : (
          <EyeCanvas3D
            mousePos={mousePos}
            containerRef={containerRef}
            impairedMuscle={gameState === 'playing' || gameState === 'feedback' ? impairedMuscle : null}
            impairedEye={impairedEye}
            gameState={gameState}
            inputMode={inputMode}
          />
        )}
        

        {/* Camera tracker — always mounted when camera mode, visibility toggled via CSS */}
        {inputMode === 'camera' && (
          <div className="mt-4 w-full flex flex-col items-center">
            <div className={showCameraPanel ? '' : 'hidden'}>
              <PenTracker
                onPositionChange={setMousePos}
                containerRef={containerRef}
                isActive={true} />
              <button
                onClick={() => setShowCameraPanel(false)}
                className="mt-2 text-xs text-slate-400 hover:text-slate-600 underline block mx-auto">
                Ocultar câmera
              </button>
            </div>
            {!showCameraPanel && (
              <button
                onClick={() => setShowCameraPanel(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-cyan-600 bg-cyan-50 border border-cyan-200 rounded-lg hover:bg-cyan-100 transition-colors">
                <Camera className="w-3.5 h-3.5" />
                Mostrar câmera / recalibrar
              </button>
            )}
          </div>
        )}

        {/* Start button */}
        {gameState === 'idle' &&
        <button
          onClick={startNewRound}
          className="mt-8 px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg text-base font-semibold tracking-wide hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg">

            Iniciar Caso
          </button>
        }

        {/* Question */}
        {(gameState === 'playing' || gameState === 'feedback') &&
        <QuestionPanel
          muscles={availableMuscles}
          difficulty={difficulty}
          impairedMuscle={impairedMuscle}
          impairedEye={impairedEye}
          selectedAnswer={selectedAnswer}
          onAnswer={handleAnswer}
          gameState={gameState}
          onNext={handleNext}
          feedback={feedback}
          correctStreak={correctStreak}
          streakToAdvance={STREAK_TO_ADVANCE} />

        }
      </div>

      {/* Feedback popup */}
      {feedback &&
      <FeedbackPopup feedback={feedback} onNext={handleNext} />
      }
    </div>);

}