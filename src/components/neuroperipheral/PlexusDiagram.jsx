import React from 'react';

export default function PlexusDiagram({ highlightSegment }) {
  const isHighlighted = (seg) => highlightSegment && highlightSegment.toLowerCase().includes(seg.toLowerCase());

  const segColor = (seg, base = '#94A3B8', highlight = '#F59E0B') =>
    isHighlighted(seg) ? highlight : base;

  return (
    <div className="flex flex-col items-center">
      <p className="text-xs text-slate-400 uppercase tracking-wide font-medium mb-2">Plexo Braquial</p>
      <svg viewBox="0 0 280 260" width="260" height="240" className="drop-shadow-sm">
        {/* Roots — vertical lines on left */}
        {[
          { y: 30, label: 'C5', seg: 'C5' },
          { y: 65, label: 'C6', seg: 'C6' },
          { y: 100, label: 'C7', seg: 'C7' },
          { y: 135, label: 'C8', seg: 'C8' },
          { y: 170, label: 'T1', seg: 'T1' },
        ].map(({ y, label, seg }) => (
          <g key={label}>
            <line x1="10" y1={y} x2="60" y2={y} stroke={segColor(label, '#94A3B8')} strokeWidth={isHighlighted(label) ? 3.5 : 2} strokeLinecap="round"/>
            <text x="4" y={y + 4} fontSize="10" fontWeight="bold" fill={segColor(label, '#64748B')}>{label}</text>
          </g>
        ))}

        {/* Trunks */}
        {/* Upper trunk C5-C6 */}
        <path d="M60 30 Q85 30 90 55 Q95 65 100 70" stroke={segColor('superior', '#94A3B8', '#F59E0B')} strokeWidth={isHighlighted('superior') || isHighlighted('C5-C6') ? 4 : 2} fill="none" strokeLinecap="round"/>
        <path d="M60 65 Q80 65 90 65 Q95 65 100 70" stroke={segColor('superior', '#94A3B8', '#F59E0B')} strokeWidth={isHighlighted('superior') || isHighlighted('C5-C6') ? 4 : 2} fill="none" strokeLinecap="round"/>
        <text x="68" y="52" fontSize="9" fill={segColor('superior', '#64748B', '#D97706')} fontWeight={isHighlighted('superior') ? 'bold' : 'normal'}>T. Superior</text>

        {/* Middle trunk C7 */}
        <path d="M60 100 Q80 100 100 100" stroke={segColor('médio', '#94A3B8', '#F59E0B')} strokeWidth={isHighlighted('médio') ? 4 : 2} fill="none" strokeLinecap="round"/>
        <text x="68" y="96" fontSize="9" fill={segColor('médio', '#64748B', '#D97706')} fontWeight={isHighlighted('médio') ? 'bold' : 'normal'}>T. Médio</text>

        {/* Lower trunk C8-T1 */}
        <path d="M60 135 Q85 135 90 130 Q95 128 100 128" stroke={segColor('inferior', '#94A3B8', '#F59E0B')} strokeWidth={isHighlighted('inferior') || isHighlighted('C8-T1') ? 4 : 2} fill="none" strokeLinecap="round"/>
        <path d="M60 170 Q80 155 90 140 Q96 133 100 128" stroke={segColor('inferior', '#94A3B8', '#F59E0B')} strokeWidth={isHighlighted('inferior') || isHighlighted('C8-T1') ? 4 : 2} fill="none" strokeLinecap="round"/>
        <text x="68" y="152" fontSize="9" fill={segColor('inferior', '#64748B', '#D97706')} fontWeight={isHighlighted('inferior') ? 'bold' : 'normal'}>T. Inferior</text>

        {/* Divisions (anterior/posterior) simplified */}
        <line x1="100" y1="70" x2="130" y2="80" stroke="#CBD5E1" strokeWidth="1.5"/>
        <line x1="100" y1="70" x2="130" y2="65" stroke="#CBD5E1" strokeWidth="1.5"/>
        <line x1="100" y1="100" x2="130" y2="95" stroke="#CBD5E1" strokeWidth="1.5"/>
        <line x1="100" y1="100" x2="130" y2="108" stroke="#CBD5E1" strokeWidth="1.5"/>
        <line x1="100" y1="128" x2="130" y2="118" stroke="#CBD5E1" strokeWidth="1.5"/>
        <line x1="100" y1="128" x2="130" y2="135" stroke="#CBD5E1" strokeWidth="1.5"/>

        {/* Fascicles / Cords */}
        {/* Posterior cord */}
        <path d="M130 65 Q155 72 160 80" stroke={segColor('posterior', '#94A3B8', '#F59E0B')} strokeWidth={isHighlighted('posterior') ? 4 : 2} fill="none"/>
        <path d="M130 80 Q148 82 160 80" stroke={segColor('posterior', '#94A3B8', '#F59E0B')} strokeWidth={isHighlighted('posterior') ? 4 : 2} fill="none"/>
        <path d="M130 95 Q148 88 160 80" stroke={segColor('posterior', '#94A3B8', '#F59E0B')} strokeWidth={isHighlighted('posterior') ? 4 : 2} fill="none"/>
        <text x="145" y="70" fontSize="9" fill={segColor('posterior', '#64748B', '#D97706')} fontWeight={isHighlighted('posterior') ? 'bold' : 'normal'}>F. Posterior</text>

        {/* Lateral cord */}
        <path d="M130 65 Q148 105 160 115" stroke={segColor('lateral', '#94A3B8', '#F59E0B')} strokeWidth={isHighlighted('lateral') ? 4 : 2} fill="none"/>
        <path d="M130 108 Q146 112 160 115" stroke={segColor('lateral', '#94A3B8', '#F59E0B')} strokeWidth={isHighlighted('lateral') ? 4 : 2} fill="none"/>
        <text x="145" y="108" fontSize="9" fill={segColor('lateral', '#64748B', '#D97706')} fontWeight={isHighlighted('lateral') ? 'bold' : 'normal'}>F. Lateral</text>

        {/* Medial cord */}
        <path d="M130 118 Q148 140 160 148" stroke={segColor('medial', '#94A3B8', '#F59E0B')} strokeWidth={isHighlighted('medial') ? 4 : 2} fill="none"/>
        <path d="M130 135 Q146 143 160 148" stroke={segColor('medial', '#94A3B8', '#F59E0B')} strokeWidth={isHighlighted('medial') ? 4 : 2} fill="none"/>
        <text x="140" y="148" fontSize="9" fill={segColor('medial', '#64748B', '#D97706')} fontWeight={isHighlighted('medial') ? 'bold' : 'normal'}>F. Medial</text>

        {/* Terminal nerves */}
        {[
          { x1: 160, y1: 80, x2: 220, y2: 60, label: 'Axilar', y: 58 },
          { x1: 160, y1: 80, x2: 220, y2: 82, label: 'Radial', y: 80 },
          { x1: 160, y1: 115, x2: 220, y2: 105, label: 'Musculoc.', y: 103 },
          { x1: 160, y1: 115, x2: 220, y2: 120, label: 'Mediano', y: 118 },
          { x1: 160, y1: 148, x2: 220, y2: 138, label: 'Mediano', y: 136 },
          { x1: 160, y1: 148, x2: 220, y2: 156, label: 'Ulnar', y: 154 },
        ].map(({ x1, y1, x2, y2, label, y }, i) => (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#94A3B8" strokeWidth="1.5" strokeDasharray={i > 2 ? "none" : "none"}/>
            <text x={x2 + 2} y={y + 4} fontSize="8" fill="#64748B">{label}</text>
          </g>
        ))}

        {/* Highlight indicator dot */}
        {highlightSegment && (
          <circle cx="258" cy="20" r="6" fill="#F59E0B" opacity="0.8">
            <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1.5s" repeatCount="indefinite"/>
          </circle>
        )}
      </svg>

      {highlightSegment && (
        <div className="mt-1 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
          ⚠️ {highlightSegment} destacado
        </div>
      )}
    </div>
  );
}