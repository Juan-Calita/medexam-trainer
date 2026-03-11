import React, { useState, useRef, useEffect, useCallback } from 'react';
import EyeCanvas from '@/components/extraocular/EyeCanvas';
import QuestionPanel from '@/components/extraocular/QuestionPanel';
import GameHeader from '@/components/extraocular/ExtraocularHeader';
import FeedbackPopup from '@/components/extraocular/FeedbackPopup';
import { MUSCLES, getMusclesForDifficulty, getImpairedMovement } from '@/components/extraocular/muscleData';

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
  const containerRef = useRef(null);

  const DIFFICULTY_LEVELS = ['basic', 'intermediate', 'advanced'];
  const STREAK_TO_ADVANCE = 3;

  const handleMouseMove = useCallback((e) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  }, []);

  const startNewRound = useCallback(() => {
    const available = getMusclesForDifficulty(difficulty);
    const historyForLevel = muscleHistory[difficulty] || {};
    const filtered = available.filter(m => (historyForLevel[m.id] || 0) < 2);
    const pool = filtered.length > 0 ? filtered : available;
    const muscle = pool[Math.floor(Math.random() * pool.length)];
    setMuscleHistory(prev => {
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
    setRound(r => r + 1);
  }, [difficulty, muscleHistory]);

  const handleAnswer = useCallback((muscleId) => {
    if (gameState !== 'playing') return;
    const correct = muscleId === impairedMuscle.id;
    setSelectedAnswer(muscleId);
    setFeedback({ correct, muscle: impairedMuscle, chosenId: muscleId });
    if (correct) {
      setScore(s => s + 1);
      setCorrectStreak(prev => {
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
  }, [gameState, impairedMuscle, difficulty, correctStreak]);

  const handleNext = useCallback(() => {
    startNewRound();
  }, [startNewRound]);

  const availableMuscles = getMusclesForDifficulty(difficulty);

  return (
    <div
      className="min-h-screen bg-white flex flex-col items-center"
      onMouseMove={handleMouseMove}
      ref={containerRef}
    >
      {/* Header */}
      <GameHeader score={score} round={round} difficulty={difficulty} setDifficulty={setDifficulty} gameState={gameState} />

      {/* Face + Eyes */}
      <div className="flex flex-col items-center mt-6 w-full max-w-2xl px-4">
        <EyeCanvas
          mousePos={mousePos}
          containerRef={containerRef}
          impairedMuscle={gameState === 'playing' || gameState === 'feedback' ? impairedMuscle : null}
          impairedEye={impairedEye}
          gameState={gameState}
        />

        {/* Start button */}
        {gameState === 'idle' && (
          <button
            onClick={startNewRound}
            className="mt-8 px-8 py-3 bg-blue-600 text-white rounded-lg text-base font-semibold tracking-wide hover:bg-blue-700 transition-colors shadow-md"
          >
            Iniciar Caso
          </button>
        )}

        {/* Question */}
        {(gameState === 'playing' || gameState === 'feedback') && (
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
            streakToAdvance={STREAK_TO_ADVANCE}
          />
        )}
      </div>

      {/* Feedback popup */}
      {feedback && (
        <FeedbackPopup feedback={feedback} onNext={handleNext} />
      )}
    </div>
  );
}