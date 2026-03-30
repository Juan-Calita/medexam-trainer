import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FeedbackPopup({ feedback }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    if (feedback.correct) {
      const t = setTimeout(() => setVisible(false), 1600);
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
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl border text-sm font-semibold backdrop-blur-md ${
            feedback.correct
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-emerald-500/10'
              : 'bg-rose-500/20 border-rose-500/40 text-rose-300 shadow-rose-500/10'
          }`}
          style={{ minWidth: 200 }}
        >
          <span className="text-xl">{feedback.correct ? '✓' : '✗'}</span>
          <span>{feedback.correct ? 'Correto! Muito bem.' : 'Incorreto — revise abaixo.'}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}