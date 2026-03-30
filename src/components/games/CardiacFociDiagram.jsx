import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useIsTouchDevice } from '@/hooks/useIsTouchDevice';

export default function CardiacFociDiagram({ placedLabels, onDrop, highlightedRegion, feedback, selectedLabel }) {
  const isTouch = useIsTouchDevice();

  const { data: regions = [] } = useQuery({
    queryKey: ['regions', 'cardiac_foci'],
    queryFn: () => base44.entities.GameRegion.filter({ game_type: 'cardiac_foci', active: true }),
  });

  const FOCI_REGIONS = regions.reduce((acc, r) => {
    acc[r.region_name] = { x: r.x, y: r.y, width: r.width, height: r.height };
    return acc;
  }, {});

  const handleDrop = (e, region) => {
    e.preventDefault();
    const label = e.dataTransfer.getData('text');
    onDrop(region, label);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleTouchZone = (region) => {
    if (!isTouch || !selectedLabel) return;
    onDrop(region, selectedLabel);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <img 
        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/698beb7c76ba1376ff50d67a/8b2272e72_image.png"
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
            onDrop={!isTouch ? (e) => handleDrop(e, region) : undefined}
            onDragOver={!isTouch ? handleDragOver : undefined}
            onClick={() => handleTouchZone(region)}
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