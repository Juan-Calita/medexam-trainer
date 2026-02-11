import React from 'react';

const REGION_POSITIONS = {
  'Hipocôndrio direito': { x: 5, y: 8, width: 28, height: 28 },
  'Epigástrio': { x: 36, y: 8, width: 28, height: 28 },
  'Hipocôndrio esquerdo': { x: 67, y: 8, width: 28, height: 28 },
  'Flanco direito': { x: 5, y: 36, width: 28, height: 28 },
  'Mesogástrico': { x: 36, y: 36, width: 28, height: 28 },
  'Flanco esquerdo': { x: 67, y: 36, width: 28, height: 28 },
  'Fossa ilíaca direita': { x: 5, y: 64, width: 28, height: 28 },
  'Hipogástrio': { x: 36, y: 64, width: 28, height: 28 },
  'Fossa ilíaca esquerda': { x: 67, y: 64, width: 28, height: 28 },
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
      {/* Abdomen Image */}
      <img 
        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698beb7c76ba1376ff50d67a/c76a4c164_image.png" 
        alt="Diagrama Abdominal"
        className="w-full h-auto rounded-lg"
      />
      
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