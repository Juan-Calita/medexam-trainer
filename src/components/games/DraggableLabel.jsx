import React from 'react';
import { GripVertical } from 'lucide-react';
import { useIsTouchDevice } from '@/hooks/useIsTouchDevice';

export default function DraggableLabel({ 
  label, 
  isPlaced, 
  retriesLeft,
  onDragStart,
  // mobile click-to-select
  isSelected,
  onSelect,
}) {
  const isTouch = useIsTouchDevice();

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', label);
    onDragStart(label);
  };

  const handleClick = () => {
    if (!isTouch) return;
    if (onSelect) onSelect(label);
  };

  if (isPlaced) return null;

  return (
    <div
      draggable={!isTouch}
      onDragStart={!isTouch ? handleDragStart : undefined}
      onClick={handleClick}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg
        bg-white border-2 shadow-sm
        transition-all duration-200
        ${isTouch ? 'cursor-pointer active:scale-95' : 'cursor-grab active:cursor-grabbing hover:border-teal-400 hover:shadow-md'}
        ${isSelected ? 'border-blue-500 bg-blue-50 shadow-md scale-105' : 'border-slate-200'}
        ${!isSelected && retriesLeft < 3 ? 'border-amber-300' : ''}
        ${!isSelected && retriesLeft === 1 ? 'border-rose-300' : ''}
      `}
    >
      <GripVertical className="w-4 h-4 text-slate-400" />
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {retriesLeft !== undefined && retriesLeft < 3 && (
        <span className={`text-xs px-1.5 py-0.5 rounded ${
          retriesLeft === 1 ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'
        }`}>
          {retriesLeft} left
        </span>
      )}
    </div>
  );
}