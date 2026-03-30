import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mouse, Camera, Play, Eye, X } from 'lucide-react';
import EyeCanvas from '@/components/extraocular/EyeCanvas';
import QuestionPanel from '@/components/extraocular/QuestionPanel';
import FeedbackPopup from '@/components/extraocular/FeedbackPopup';
import PenTracker from '@/components/extraocular/PenTracker';
import { getMusclesForDifficulty } from '@/components/extraocular/muscleData';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

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

  const difficultyNames = { basic: 'Básico', intermediate: 'Intermediário', advanced: 'Avançado' };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 via-purple-900 to-blue-900 text-white sticky top-0 z-40 shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to={createPageUrl('Home')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </Link>
          <div className="flex items-center gap-3">
            <Eye className="w-6 h-6 text-cyan-300" />
            <div>
              <h1 className="text-xl font-bold">Músculos Extraoculares</h1>
              <p className="text-xs text-blue-200">Simulador Clínico Interativo</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-200">Pontuação</div>
            <motion.div
              key={score}
              initial={{ scale: 1.3, color: '#06b6d4' }}
              animate={{ scale: 1, color: '#fff' }}
              transition={{ duration: 0.4 }}
              className="text-2xl font-bold"
            >
              {score}
            </motion.div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {gameState === 'idle' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Welcome card */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-blue-100">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Bem-vindo ao Simulador! 👁️
              </h2>
              <p className="text-slate-600 mb-6">
                Teste seus conhecimentos de anatomia dos músculos extraoculares. Escolha seu nível e comece a treinar.
              </p>

              {/* Difficulty selector */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                {['basic', 'intermediate', 'advanced'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`p-4 rounded-xl border-2 transition-all font-semibold ${
                      difficulty === level
                        ? 'border-purple-600 bg-purple-50 text-purple-700'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-purple-300'
                    }`}
                  >
                    {difficultyNames[level]}
                  </button>
                ))}
              </div>

              {/* Input mode selector */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => setInputMode('mouse')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                    inputMode === 'mouse'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Mouse className="w-4 h-4" /> Mouse
                </button>
                <button
                  onClick={() => { setInputMode('camera'); setShowCameraPanel(true); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${
                    inputMode === 'camera'
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Camera className="w-4 h-4" /> Câmera
                </button>
              </div>

              {/* Start button */}
              <motion.button
                onClick={startNewRound}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-shadow"
              >
                <Play className="w-5 h-5 fill-white" />
                Iniciar Simulação
              </motion.button>
            </div>
          </motion.div>
        )}

        {(gameState === 'playing' || gameState === 'feedback') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid lg:grid-cols-3 gap-6"
          >
            {/* Canvas section */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-8 shadow-sm border border-blue-100">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-6">
                {inputMode === 'camera'
                  ? 'Mova a caneta sobre o rosto'
                  : 'Mova o mouse sobre o rosto'}
              </p>
              <div className="flex justify-center">
                <EyeCanvas
                  mousePos={mousePos}
                  containerRef={containerRef}
                  impairedMuscle={gameState === 'playing' || gameState === 'feedback' ? impairedMuscle : null}
                  impairedEye={impairedEye}
                  gameState={gameState}
                  inputMode={inputMode}
                />
              </div>

              {/* Camera panel */}
              {inputMode === 'camera' && (
                <div className="mt-6">
                  <AnimatePresence>
                    {showCameraPanel && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                          <PenTracker
                            onPositionChange={setMousePos}
                            containerRef={containerRef}
                            isActive={true}
                          />
                          <button
                            onClick={() => setShowCameraPanel(false)}
                            className="mt-3 mx-auto block text-xs text-blue-600 hover:text-blue-700 underline"
                          >
                            Ocultar câmera
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {!showCameraPanel && (
                    <motion.button
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => setShowCameraPanel(true)}
                      className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-semibold"
                    >
                      <Camera className="w-4 h-4" />
                      Mostrar câmera / recalibrar
                    </motion.button>
                  )}
                </div>
              )}
            </div>

            {/* Question panel */}
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
          </motion.div>
        )}
      </main>

      {/* Feedback popup */}
      {feedback && <FeedbackPopup feedback={feedback} onNext={handleNext} />}

      {/* Mouse listener */}
      <div
        ref={containerRef}
        onMouseMove={inputMode === 'mouse' ? handleMouseMove : undefined}
        className="fixed inset-0 pointer-events-none"
      />
    </div>
  );
}