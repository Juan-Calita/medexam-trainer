import React from 'react';

const FOCI_REGIONS = {
  'Foco Aórtico': { x: 51, y: 15.5, width: 10, height: 8 },
  'Foco Pulmonar': { x: 34, y: 15.5, width: 10, height: 8 },
  'Foco Aórtico acessório': { x: 59, y: 23.5, width: 10, height: 8 },
  'Foco Tricúspide': { x: 42.5, y: 28.5, width: 10, height: 8 },
  'Foco Mitral': { x: 50.5, y: 34.5, width: 10, height: 8 },
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
        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698beb7c76ba1376ff50d67a/0563691bd_Designsemnome.png"
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