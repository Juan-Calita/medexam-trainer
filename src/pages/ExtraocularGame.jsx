import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mouse, Camera, Play, Eye } from 'lucide-react';
import EyeCanvas from '@/components/extraocular/EyeCanvas';
import QuestionPanel from '@/components/extraocular/QuestionPanel';
import GameHeader from '@/components/extraocular/ExtraocularHeader';
import FeedbackPopup from '@/components/extraocular/FeedbackPopup';
import PenTracker from '@/components/extraocular/PenTracker';
import { getMusclesForDifficulty } from '@/components/extraocular/muscleData';

export default function ExtraocularGame() {
  const [difficulty, setDifficulty] = useState('basic');
  const [gameState, setGameState] = useState('idle');
  const [score, setScore] = useState(0);
  const [round, setRound] = useState(0);
  const [impairedMuscle, setImpairedMuscle] = useState(null);
  const [impairedEye, setImpairedEye] = useState('right');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [feedback, setFeedback] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [muscleHistory, setMuscleHistory] = useState({});
  const [inputMode, setInputMode] = useState('mouse');
  const [showCameraPanel, setShowCameraPanel] = useState(false);
  const containerRef = useRef(null);

  const DIFFICULTY_LEVELS = ['basic', 'intermediate', 'advanced'];
  const STREAK_TO_ADVANCE = 3;

  const handleMouseMove = useCallback((e) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
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
      if (filtered.length === 0) return { ...prev, [difficulty]: { [muscle.id]: 1 } };
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
    setGameState('feedback');
  }, [gameState, impairedMuscle, difficulty]);

  const handleNext = useCallback(() => startNewRound(), [startNewRound]);
  const availableMuscles = getMusclesForDifficulty(difficulty);

  return (
    <div
      className="min-h-screen bg-slate-950 flex flex-col items-center"
      style={{
        backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(6,182,212,0.06) 0%, transparent 60%)',
      }}
      onMouseMove={inputMode === 'mouse' ? handleMouseMove : undefined}
      ref={containerRef}
    >
      {/* Header */}
      <GameHeader
        score={score}
        round={round}
        difficulty={difficulty}
        setDifficulty={setDifficulty}
        gameState={gameState}
      />

      {/* Beta badge for camera mode */}
      <AnimatePresence>
        {inputMode === 'camera' && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="fixed top-[72px] right-4 z-50 flex items-start gap-2 bg-amber-900/70 border border-amber-500/40 text-amber-200 text-xs font-medium px-3 py-2 rounded-lg shadow-lg max-w-[220px] backdrop-blur-sm"
          >
            <span className="text-base mt-0.5">🧪</span>
            <span><strong>Modo teste:</strong> pode haver irregularidades. Recalibragens durante o uso podem ser necessárias.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex flex-col items-center w-full max-w-2xl px-4 pb-16">

        {/* Input mode toggle */}
        <div className="flex items-center gap-1 mt-6 bg-slate-800/80 border border-slate-700/50 rounded-full p-1 backdrop-blur-sm">
          <button
            onClick={() => setInputMode('mouse')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              inputMode === 'mouse'
                ? 'bg-slate-600 text-slate-100 shadow-sm'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Mouse className="w-3.5 h-3.5" />
            Mouse
          </button>
          <button
            onClick={() => { setInputMode('camera'); setShowCameraPanel(true); }}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              inputMode === 'camera'
                ? 'bg-cyan-600/80 text-cyan-100 shadow-sm shadow-cyan-500/20'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            Câmera (caneta azul)
          </button>
        </div>

        {/* Eye Canvas */}
        <motion.div
          className="mt-6 w-full flex justify-center"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <EyeCanvas
            mousePos={mousePos}
            containerRef={containerRef}
            impairedMuscle={gameState === 'playing' || gameState === 'feedback' ? impairedMuscle : null}
            impairedEye={impairedEye}
            gameState={gameState}
            inputMode={inputMode}
          />
        </motion.div>

        {/* Camera panel */}
        {inputMode === 'camera' && (
          <div className="mt-4 w-full flex flex-col items-center">
            <AnimatePresence>
              {showCameraPanel && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden w-full flex flex-col items-center"
                >
                  <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 w-full">
                    <PenTracker
                      onPositionChange={setMousePos}
                      containerRef={containerRef}
                      isActive={true}
                    />
                  </div>
                  <button
                    onClick={() => setShowCameraPanel(false)}
                    className="mt-2 text-xs text-slate-500 hover:text-slate-300 underline"
                  >
                    Ocultar câmera
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            {!showCameraPanel && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setShowCameraPanel(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/20 transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
                Mostrar câmera / recalibrar
              </motion.button>
            )}
          </div>
        )}

        {/* Start button (idle) */}
        <AnimatePresence>
          {gameState === 'idle' && (
            <motion.button
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={startNewRound}
              className="mt-10 flex items-center gap-3 px-10 py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-900 rounded-2xl text-base font-bold tracking-wide transition-all shadow-2xl shadow-cyan-500/25"
            >
              <Play className="w-5 h-5 fill-slate-900" />
              Iniciar Caso
            </motion.button>
          )}
        </AnimatePresence>

        {/* Question panel */}
        <AnimatePresence mode="wait">
          {(gameState === 'playing' || gameState === 'feedback') && (
            <QuestionPanel
              key={round}
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
              streakToAdvance={STREAK_TO_ADVANCE}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Feedback popup */}
      {feedback && <FeedbackPopup feedback={feedback} onNext={handleNext} />}
    </div>
  );
}