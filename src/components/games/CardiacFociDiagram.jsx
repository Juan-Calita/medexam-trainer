import React from 'react';

const FOCI_REGIONS = {
  'Foco Aórtico': { x: 54, y: 24, width: 8, height: 6 },
  'Foco Pulmonar': { x: 38, y: 24, width: 8, height: 6 },
  'Foco Aórtico acessório': { x: 40, y: 34, width: 9, height: 6 },
  'Foco Tricúspide': { x: 52, y: 54, width: 8, height: 6 },
  'Foco Mitral': { x: 34, y: 60, width: 8, height: 6 },
};

export default function CardiacFociDiagram({ placedLabels, onDrop, highlightedRegion, feedback }) {
  const handleDrop = (e, region) => {
    e.preventDefault();
    const label = e.dataTransfer.getData('text');
    onDrop(region, label);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <img 
        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698beb7c76ba1376ff50d67a/e6ca32cb5_image.png"
        alt="Diagrama do Tórax"
        className="w-full h-auto rounded-lg"
      />
      
      {Object.entries(FOCI_REGIONS).map(([region, coords]) => {
        const isPlaced = placedLabels[region];
        const isHighlighted = highlightedRegion === region;
        const hasFeedback = feedback && feedback.region === region;
        
        return (
          <div
            key={region}
            onDrop={(e) => handleDrop(e, region)}
            onDragOver={handleDragOver}
            className={`absolute border-2 rounded-lg transition-all duration-300 flex items-center justify-center ${
              hasFeedback
                ? feedback.correct
                  ? 'border-emerald-500 bg-emerald-100/90'
                  : 'border-rose-500 bg-rose-100/90'
                : isPlaced
                ? 'border-teal-500 bg-teal-100/70'
                : isHighlighted
                ? 'border-amber-400 bg-amber-100/50'
                : 'border-slate-300 border-dashed bg-white/30'
            }`}
            style={{
              left: `${coords.x}%`,
              top: `${coords.y}%`,
              width: `${coords.width}%`,
              height: `${coords.height}%`,
            }}
          >
            {isPlaced && (
              <span className="text-xs font-medium text-slate-700 text-center px-1">
                {placedLabels[region]}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}