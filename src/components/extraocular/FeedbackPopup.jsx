import React, { useEffect, useState } from 'react';

export default function FeedbackPopup({ feedback, onNext }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    if (feedback.correct) {
      const t = setTimeout(() => setVisible(false), 1800);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  if (!visible) return null;

  return (
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg border text-sm font-semibold transition-all duration-300 ${
        feedback.correct
          ? 'bg-green-50 border-green-300 text-green-800'
          : 'bg-red-50 border-red-300 text-red-800'
      }`}
      style={{ minWidth: 220 }}
    >
      <span className="text-xl">{feedback.correct ? '✓' : '✗'}</span>
      <span>{feedback.correct ? 'Correto! Muito bem.' : 'Incorreto — revise a explicação abaixo.'}</span>
    </div>
  );
}