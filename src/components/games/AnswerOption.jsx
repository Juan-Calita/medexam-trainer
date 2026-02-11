import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function AnswerOption({ 
  option, 
  index, 
  isSelected, 
  isCorrect, 
  showResult, 
  onClick,
  disabled 
}) {
  const letters = ['A', 'B', 'C', 'D'];
  
  const getStyles = () => {
    if (!showResult) {
      return isSelected 
        ? 'border-teal-500 bg-teal-50 shadow-md' 
        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm';
    }
    
    if (isCorrect) {
      return 'border-emerald-500 bg-emerald-50';
    }
    
    if (isSelected && !isCorrect) {
      return 'border-rose-500 bg-rose-50';
    }
    
    return 'border-slate-200 bg-slate-50 opacity-60';
  };

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={() => !disabled && onClick(option)}
      disabled={disabled}
      className={`
        w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200
        ${getStyles()}
        ${disabled ? 'cursor-default' : 'cursor-pointer'}
      `}
    >
      <span className={`
        w-8 h-8 flex items-center justify-center rounded-lg text-sm font-semibold
        ${showResult && isCorrect ? 'bg-emerald-500 text-white' : ''}
        ${showResult && isSelected && !isCorrect ? 'bg-rose-500 text-white' : ''}
        ${!showResult && isSelected ? 'bg-teal-500 text-white' : ''}
        ${!showResult && !isSelected ? 'bg-slate-100 text-slate-600' : ''}
        ${showResult && !isCorrect && !isSelected ? 'bg-slate-200 text-slate-400' : ''}
      `}>
        {letters[index]}
      </span>
      
      <span className={`flex-1 text-left font-medium ${
        showResult && !isCorrect && !isSelected ? 'text-slate-400' : 'text-slate-700'
      }`}>
        {option}
      </span>
      
      {showResult && isCorrect && (
        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
      )}
      {showResult && isSelected && !isCorrect && (
        <XCircle className="w-6 h-6 text-rose-500" />
      )}
    </motion.button>
  );
}