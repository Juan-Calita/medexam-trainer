import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FeedbackPopup({ feedback }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    if (feedback.correct) {
      const t = setTimeout(() => setVisible(false), 1400);
      return () => clearTimeout(t);
    }
  }, [feedback]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3 rounded-xl shadow-lg border text-sm font-semibold ${
            feedback.correct
              ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
              : 'bg-rose-100 border-rose-300 text-rose-800'
          }`}
        >
          <span className="text-lg">{feedback.correct ? '✓' : '✗'}</span>
          <span>{feedback.correct ? 'Correto! Excelente.' : 'Incorreto — revise abaixo.'}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}