import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useIsTouchDevice } from '@/hooks/useIsTouchDevice';

export default function AbdominalDiagram({ 
  placedLabels, 
  onDropZone, 
  highlightedRegion,
  feedbackRegion,
  selectedLabel,
}) {
  const isTouch = useIsTouchDevice();

  const { data: regions = [] } = useQuery({
    queryKey: ['regions', 'abdominal_regions'],
    queryFn: () => base44.entities.GameRegion.filter({ game_type: 'abdominal_regions', active: true }),
  });

  const REGION_POSITIONS = regions.reduce((acc, r) => {
    acc[r.region_name] = { x: r.x, y: r.y, width: r.width, height: r.height };
    return acc;
  }, {});

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, regionName) => {
    e.preventDefault();
    const label = e.dataTransfer.getData('text/plain');
    onDropZone(label, regionName);
  };

  const handleTouchZone = (regionName) => {
    if (!isTouch || !selectedLabel) return;
    onDropZone(selectedLabel, regionName);
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
              onDragOver={!isTouch ? handleDragOver : undefined}
              onDrop={!isTouch ? (e) => handleDrop(e, name) : undefined}
              onClick={() => handleTouchZone(name)}
              className={`absolute flex items-center justify-center p-1 rounded-lg border-2 transition-all duration-300 ${
                isPlaced 
                  ? 'bg-emerald-200 border-emerald-500 border-solid' 
                  : feedback === 'correct'
                    ? 'bg-emerald-300 border-emerald-600 border-solid'
                    : feedback === 'incorrect'
                      ? 'bg-rose-300 border-rose-600 border-solid'
                      : 'bg-slate-300 border-slate-500 border-solid'
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