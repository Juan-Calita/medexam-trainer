import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FeedbackModal({ 
  isOpen, 
  isCorrect, 
  title, 
  explanation, 
  onClose,
  autoClose = true 
}) {
  useEffect(() => {
    if (isOpen && autoClose && isCorrect) {
      const timer = setTimeout(onClose, 2500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoClose, isCorrect, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className={`
              max-w-sm w-full rounded-2xl p-6 shadow-2xl
              ${isCorrect ? 'bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200' : 'bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-200'}
            `}
          >
            <div className="flex items-start gap-4">
              <div className={`
                p-3 rounded-full
                ${isCorrect ? 'bg-emerald-100' : 'bg-rose-100'}
              `}>
                {isCorrect ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-600" />
                )}
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold text-lg ${isCorrect ? 'text-emerald-800' : 'text-rose-800'}`}>
                  {isCorrect ? 'Correct!' : 'Not quite right'}
                </h3>
                <p className="text-slate-600 font-medium mt-1">{title}</p>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-white/60 rounded-xl">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-600 leading-relaxed">{explanation}</p>
              </div>
            </div>

            {!isCorrect && (
              <Button 
                onClick={onClose}
                className="w-full mt-4 bg-slate-800 hover:bg-slate-700"
              >
                Try Again
              </Button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}