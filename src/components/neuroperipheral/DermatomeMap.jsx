import React from 'react';

// Simplified body outline with dermatome regions
const DERMATOME_REGIONS = {
  C6: { label: 'C6', path: 'M 60 95 Q 40 105 35 140 Q 33 155 38 165 Q 50 155 55 140 Q 58 120 62 105 Z', color: '#8B5CF6' },
  C7: { label: 'C7', path: 'M 60 95 Q 70 108 75 135 Q 78 152 74 165 Q 62 158 60 140 Q 59 118 60 105 Z', color: '#7C3AED' },
  C8: { label: 'C8', path: 'M 55 150 Q 48 168 50 180 Q 58 178 62 165 Q 65 155 60 148 Z', color: '#6D28D9' },
  L4: { label: 'L4', path: 'M 108 148 Q 112 168 110 185 Q 104 185 102 170 Q 100 155 105 148 Z', color: '#3B82F6' },
  L5: { label: 'L5', path: 'M 112 165 Q 118 188 116 205 Q 110 205 108 190 Q 106 175 110 165 Z', color: '#2563EB' },
  S1: { label: 'S1', path: 'M 116 180 Q 122 200 120 215 Q 114 215 112 200 Q 110 188 114 180 Z', color: '#1D4ED8' },
};

export default function DermatomeMap({ highlightRoot, limb }) {
  const highlighted = DERMATOME_REGIONS[highlightRoot];

  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 200 280" width="160" height="224" className="drop-shadow-sm">
        {/* Body */}
        {/* Head */}
        <ellipse cx="100" cy="28" rx="22" ry="26" fill="#F5CBA7" stroke="#D4A574" strokeWidth="1.5"/>
        {/* Neck */}
        <rect x="91" y="52" width="18" height="12" rx="4" fill="#F5CBA7" stroke="#D4A574" strokeWidth="1.5"/>
        {/* Torso */}
        <path d="M72 64 Q68 80 68 110 Q68 130 72 140 L128 140 Q132 130 132 110 Q132 80 128 64 Z" fill="#F5CBA7" stroke="#D4A574" strokeWidth="1.5"/>
        
        {/* Left arm */}
        <path d="M72 68 Q50 78 42 110 Q38 130 40 155 L52 155 Q54 135 56 118 Q60 98 70 80 Z" fill="#F5CBA7" stroke="#D4A574" strokeWidth="1.5"/>
        {/* Left hand */}
        <ellipse cx="44" cy="163" rx="10" ry="14" fill="#F5CBA7" stroke="#D4A574" strokeWidth="1.5"/>
        
        {/* Right arm */}
        <path d="M128 68 Q150 78 158 110 Q162 130 160 155 L148 155 Q146 135 144 118 Q140 98 130 80 Z" fill="#F5CBA7" stroke="#D4A574" strokeWidth="1.5"/>
        {/* Right hand */}
        <ellipse cx="156" cy="163" rx="10" ry="14" fill="#F5CBA7" stroke="#D4A574" strokeWidth="1.5"/>

        {/* Pelvis */}
        <path d="M72 140 Q68 158 78 165 L122 165 Q132 158 128 140 Z" fill="#F5CBA7" stroke="#D4A574" strokeWidth="1.5"/>

        {/* Left leg */}
        <path d="M82 165 Q76 195 76 230 Q76 250 80 265 L95 265 Q96 248 96 230 Q96 200 92 170 Z" fill="#F5CBA7" stroke="#D4A574" strokeWidth="1.5"/>
        {/* Left foot */}
        <ellipse cx="86" cy="270" rx="12" ry="8" fill="#F5CBA7" stroke="#D4A574" strokeWidth="1.5"/>

        {/* Right leg */}
        <path d="M118 165 Q124 195 124 230 Q124 250 120 265 L105 265 Q104 248 104 230 Q104 200 108 170 Z" fill="#F5CBA7" stroke="#D4A574" strokeWidth="1.5"/>
        {/* Right foot */}
        <ellipse cx="114" cy="270" rx="12" ry="8" fill="#F5CBA7" stroke="#D4A574" strokeWidth="1.5"/>

        {/* Dermatome overlays */}
        {limb === 'upper' && (
          <>
            {/* C5 area */}
            <ellipse cx="46" cy="95" rx="10" ry="20" fill={highlightRoot === 'C5' ? 'rgba(99,102,241,0.4)' : 'rgba(203,213,225,0.3)'} stroke={highlightRoot === 'C5' ? '#6366F1' : 'transparent'} strokeWidth="1"/>
            {/* C6 area — lateral forearm + thumb */}
            <path d="M 43 115 Q 37 135 38 158 Q 46 162 50 148 Q 52 130 52 115 Z" 
              fill={highlightRoot === 'C6' ? 'rgba(139,92,246,0.45)' : 'rgba(203,213,225,0.3)'} 
              stroke={highlightRoot === 'C6' ? '#8B5CF6' : 'transparent'} strokeWidth="1.5"/>
            {/* C7 area — middle finger / posterior */}
            <path d="M 52 115 Q 56 132 55 155 Q 52 163 46 163 Q 46 148 48 130 Q 50 118 52 115 Z"
              fill={highlightRoot === 'C7' ? 'rgba(124,58,237,0.45)' : 'rgba(203,213,225,0.3)'}
              stroke={highlightRoot === 'C7' ? '#7C3AED' : 'transparent'} strokeWidth="1.5"/>
            {/* C8 area — medial forearm + little finger */}
            <path d="M 43 130 Q 38 148 40 165 Q 45 170 46 162 Q 46 148 44 133 Z"
              fill={highlightRoot === 'C8' ? 'rgba(109,40,217,0.45)' : 'rgba(203,213,225,0.3)'}
              stroke={highlightRoot === 'C8' ? '#6D28D9' : 'transparent'} strokeWidth="1.5"/>
          </>
        )}

        {limb === 'lower' && (
          <>
            {/* L3 area */}
            <path d="M 82 170 Q 76 192 77 215 Q 82 218 86 210 Q 88 195 88 175 Z"
              fill={highlightRoot === 'L3' ? 'rgba(59,130,246,0.4)' : 'rgba(203,213,225,0.3)'}
              stroke={highlightRoot === 'L3' ? '#3B82F6' : 'transparent'} strokeWidth="1.5"/>
            {/* L4 area — medial leg */}
            <path d="M 80 215 Q 76 238 77 258 Q 82 262 86 252 Q 88 236 88 215 Z"
              fill={highlightRoot === 'L4' ? 'rgba(59,130,246,0.5)' : 'rgba(203,213,225,0.3)'}
              stroke={highlightRoot === 'L4' ? '#3B82F6' : 'transparent'} strokeWidth="1.5"/>
            {/* L5 area — dorsum of foot */}
            <path d="M 80 258 Q 78 268 82 273 Q 88 275 92 270 Q 96 262 95 256 Z"
              fill={highlightRoot === 'L5' ? 'rgba(37,99,235,0.5)' : 'rgba(203,213,225,0.3)'}
              stroke={highlightRoot === 'L5' ? '#2563EB' : 'transparent'} strokeWidth="1.5"/>
            {/* S1 area — lateral foot */}
            <path d="M 92 268 Q 96 275 100 275 Q 104 274 104 268 Q 100 262 95 260 Z"
              fill={highlightRoot === 'S1' ? 'rgba(29,78,216,0.5)' : 'rgba(203,213,225,0.3)'}
              stroke={highlightRoot === 'S1' ? '#1D4ED8' : 'transparent'} strokeWidth="1.5"/>
          </>
        )}

        {/* Root label */}
        {highlightRoot && (
          <text x="100" y="18" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#6B7280">
            {highlightRoot}
          </text>
        )}
      </svg>

      <div className="mt-2 flex items-center gap-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: highlighted?.color || '#8B5CF6', opacity: 0.7 }}/>
        <span className="text-xs text-slate-500 font-medium">Região do dermátomo {highlightRoot}</span>
      </div>
    </div>
  );
}