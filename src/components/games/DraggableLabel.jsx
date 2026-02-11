import React from 'react';
import { GripVertical } from 'lucide-react';

export default function DraggableLabel({ 
  label, 
  isPlaced, 
  retriesLeft,
  onDragStart 
}) {
  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', label);
    onDragStart(label);
  };

  if (isPlaced) return null;

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing
        bg-white border-2 border-slate-200 shadow-sm
        hover:border-teal-400 hover:shadow-md transition-all duration-200
        ${retriesLeft < 3 ? 'border-amber-300' : ''}
        ${retriesLeft === 1 ? 'border-rose-300' : ''}
      `}
    >
      <GripVertical className="w-4 h-4 text-slate-400" />
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {retriesLeft < 3 && (
        <span className={`text-xs px-1.5 py-0.5 rounded ${
          retriesLeft === 1 ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
        }`}>
          {retriesLeft} left
        </span>
      )}
    </div>
  );
}