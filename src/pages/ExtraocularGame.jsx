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
    const muscle = available[Math.floor(Math.random() * available.length)];
    setImpairedMuscle(muscle);
    setGameState('playing');
    setFeedback(null);
    setSelectedAnswer(null);
    setRound(r => r + 1);
  }, [difficulty]);

  const handleAnswer = useCallback((muscleId) => {
    if (gameState !== 'playing') return;
    const correct = muscleId === impairedMuscle.id;
    setSelectedAnswer(muscleId);
    setFeedback({
      correct,
      muscle: impairedMuscle,
      chosenId: muscleId,
    });
    if (correct) setScore(s => s + 1);
    setGameState('feedback');
  }, [gameState, impairedMuscle]);

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
            selectedAnswer={selectedAnswer}
            onAnswer={handleAnswer}
            gameState={gameState}
            onNext={handleNext}
            feedback={feedback}
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