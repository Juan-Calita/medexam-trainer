import React from 'react';

const REGION_POSITIONS = {
  'Right hypochondrium': { x: 15, y: 12, width: 28, height: 22 },
  'Epigastrium': { x: 43, y: 12, width: 28, height: 22 },
  'Left hypochondrium': { x: 71, y: 12, width: 28, height: 22 },
  'Right flank': { x: 15, y: 34, width: 28, height: 22 },
  'Umbilical region': { x: 43, y: 34, width: 28, height: 22 },
  'Left flank': { x: 71, y: 34, width: 28, height: 22 },
  'Right iliac fossa': { x: 15, y: 56, width: 28, height: 22 },
  'Hypogastrium': { x: 43, y: 56, width: 28, height: 22 },
  'Left iliac fossa': { x: 71, y: 56, width: 28, height: 22 },
};

export default function AbdominalDiagram({ 
  placedLabels, 
  onDropZone, 
  highlightedRegion,
  feedbackRegion 
}) {
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, regionName) => {
    e.preventDefault();
    const label = e.dataTransfer.getData('text/plain');
    onDropZone(label, regionName);
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* SVG Abdomen Diagram */}
      <svg viewBox="0 0 114 100" className="w-full h-auto">
        {/* Body outline */}
        <ellipse cx="57" cy="45" rx="50" ry="48" fill="#FEF3C7" stroke="#D97706" strokeWidth="1.5" />
        
        {/* Navel */}
        <circle cx="57" cy="45" r="2" fill="#D97706" />
        
        {/* Grid lines */}
        <line x1="43" y1="8" x2="43" y2="85" stroke="#9CA3AF" strokeWidth="0.5" strokeDasharray="2,2" />
        <line x1="71" y1="8" x2="71" y2="85" stroke="#9CA3AF" strokeWidth="0.5" strokeDasharray="2,2" />
        <line x1="12" y1="34" x2="102" y2="34" stroke="#9CA3AF" strokeWidth="0.5" strokeDasharray="2,2" />
        <line x1="12" y1="56" x2="102" y2="56" stroke="#9CA3AF" strokeWidth="0.5" strokeDasharray="2,2" />
        
        {/* Rib cage hints */}
        <path d="M 30 15 Q 45 8 57 8 Q 69 8 84 15" fill="none" stroke="#D97706" strokeWidth="0.8" opacity="0.5" />
        <path d="M 25 20 Q 45 12 57 12 Q 69 12 89 20" fill="none" stroke="#D97706" strokeWidth="0.8" opacity="0.5" />
      </svg>
      
      {/* Drop zones overlay */}
      <div className="absolute inset-0">
        {Object.entries(REGION_POSITIONS).map(([name, pos]) => {
          const isPlaced = placedLabels[name];
          const isHighlighted = highlightedRegion === name;
          const feedback = feedbackRegion?.region === name ? feedbackRegion.status : null;
          
          return (
            <div
              key={name}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, name)}
              className={`absolute flex items-center justify-center p-1 rounded-lg border-2 border-dashed transition-all duration-300 ${
                isPlaced 
                  ? 'bg-emerald-100/80 border-emerald-400' 
                  : isHighlighted 
                    ? 'bg-teal-100/60 border-teal-400 scale-105' 
                    : feedback === 'correct'
                      ? 'bg-emerald-200 border-emerald-500'
                      : feedback === 'incorrect'
                        ? 'bg-rose-200 border-rose-500'
                        : 'bg-white/40 border-slate-300 hover:bg-slate-100/60 hover:border-slate-400'
              }`}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                width: `${pos.width}%`,
                height: `${pos.height}%`,
              }}
            >
              {isPlaced && (
                <span className="text-[10px] sm:text-xs font-medium text-emerald-700 text-center leading-tight px-1">
                  {name}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export { REGION_POSITIONS };