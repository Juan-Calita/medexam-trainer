import React from 'react';

// SVG illustrations for each deficit type
function WristDrop() {
  return (
    <svg viewBox="0 0 120 200" width="120" height="200">
      {/* Forearm */}
      <rect x="42" y="10" width="36" height="90" rx="18" fill="#F5CBA7" stroke="#D4A574" strokeWidth="1.5"/>
      {/* Wrist — dropped */}
      <path d="M42 100 Q60 125 78 100" stroke="#D4A574" strokeWidth="1.5" fill="#F5CBA7"/>
      {/* Hand drooping down */}
      <path d="M50 108 Q60 145 70 142 Q80 140 75 115" fill="#F5CBA7" stroke="#D4A574" strokeWidth="1.5"/>
      {/* Fingers limp */}
      <path d="M52 130 Q48 155 50 160" stroke="#D4A574" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M58 135 Q55 162 57 167" stroke="#D4A574" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M64 136 Q62 164 64 168" stroke="#D4A574" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M70 133 Q69 158 71 162" stroke="#D4A574" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      {/* Sensory area highlight */}
      <ellipse cx="58" cy="118" rx="12" ry="8" fill="rgba(239,68,68,0.25)" stroke="#EF4444" strokeWidth="1" strokeDasharray="3,2"/>
      {/* Arrow showing drop */}
      <path d="M90 85 L90 110" stroke="#EF4444" strokeWidth="2" markerEnd="url(#arrow)"/>
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="#EF4444"/>
        </marker>
      </defs>
      <text x="60" y="190" textAnchor="middle" fontSize="9" fill="#6B7280">Wrist Drop</text>
    </svg>
  );
}

function HandBenediction() {
  return (
    <svg viewBox="0 0 120 200" width="120" height="200">
      {/* Palm */}
      <rect x="38" y="80" width="44" height="50" rx="8" fill="#F5CBA7" stroke="#D4A574" strokeWidth="1.5"/>
      {/* Thumb */}
      <path d="M38 95 Q25 85 22 75 Q20 65 30 65 Q38 65 38 80" fill="#F5CBA7" stroke="#D4A574" strokeWidth="1.5"/>
      {/* Index — extended (impaired) */}
      <rect x="62" y="40" width="10" height="45" rx="5" fill="#F5CBA7" stroke="#D4A574" strokeWidth="1.5"/>
      {/* Middle — extended (impaired) */}
      <rect x="74" y="38" width="10" height="47" rx="5" fill="#F5CBA7" stroke="#D4A574" strokeWidth="1.5"/>
      {/* Ring — flexed */}
      <path d="M52 80 Q52 65 55 60 Q58 55 62 60 Q65 65 63 80" fill="#F5CBA7" stroke="#D4A574" strokeWidth="1.5"/>
      {/* Little — flexed */}
      <path d="M40 80 Q40 68 43 63 Q46 58 50 63 Q53 68 51 80" fill="#F5CBA7" stroke="#D4A574" strokeWidth="1.5"/>
      {/* Highlight impaired digits */}
      <rect x="61" y="38" width="25" height="48" rx="5" fill="rgba(239,68,68,0.18)" stroke="#EF4444" strokeWidth="1" strokeDasharray="3,2"/>
      <text x="60" y="190" textAnchor="middle" fontSize="9" fill="#6B7280">Mão em Bênção</text>
    </svg>
  );
}

function ClawHand() {
  return (
    <svg viewBox="0 0 120 200" width="120" height="200">
      {/* Palm */}
      <rect x="38" y="90" width="44" height="45" rx="8" fill="#F5CBA7" stroke="#D4A574" strokeWidth="1.5"/>
      {/* Thumb */}
      <path d="M38 105 Q26 95 24 85 Q22 75 32 75 Q39 75 38 90" fill="#F5CBA7" stroke="#D4A574" strokeWidth="1.5"/>
      {/* Index — normal */}
      <rect x="60" y="55" width="9" height="38" rx="4" fill="#F5CBA7" stroke="#D4A574" strokeWidth="1.5"/>
      {/* Middle — normal */}
      <rect x="71" y="53" width="9" height="40" rx="4" fill="#F5CBA7" stroke="#D4A574" strokeWidth="1.5"/>
      {/* Ring — claw (hyperextended MCP, flexed IPs) */}
      <path d="M49 90 L49 70 Q49 58 55 55 Q60 52 62 58 L60 72 Q58 80 52 90" fill="#F5CBA7" stroke="#D4A574" strokeWidth="1.5"/>
      {/* Little — claw */}
      <path d="M38 90 L38 72 Q38 60 44 57 Q49 54 51 60 L49 74 Q47 82 41 90" fill="#F5CBA7" stroke="#D4A574" strokeWidth="1.5"/>
      {/* Highlight 4th-5th claw area */}
      <path d="M36 56 Q44 50 64 50 Q66 50 66 74 Q66 90 38 90 Z" fill="rgba(239,68,68,0.18)" stroke="#EF4444" strokeWidth="1" strokeDasharray="3,2"/>
      <text x="60" y="190" textAnchor="middle" fontSize="9" fill="#6B7280">Garra Ulnar (4°-5°)</text>
    </svg>
  );
}

function DeltoidParalysis() {
  return (
    <svg viewBox="0 0 160 200" width="160" height="200">
      {/* Body outline simple */}
      <ellipse cx="80" cy="50" rx="28" ry="32" fill="#F5CBA7" stroke="#D4A574" strokeWidth="1.5"/>
      {/* Left arm hanging */}
      <path d="M52 60 Q30 80 28 130 Q27 150 32 160" stroke="#D4A574" strokeWidth="12" strokeLinecap="round" fill="none"/>
      {/* Right arm normal */}
      <path d="M108 60 Q128 72 132 110 Q134 130 130 145" stroke="#D4A574" strokeWidth="12" strokeLinecap="round" fill="none"/>
      {/* Shoulder sensory patch */}
      <ellipse cx="52" cy="68" rx="14" ry="10" fill="rgba(239,68,68,0.25)" stroke="#EF4444" strokeWidth="1" strokeDasharray="3,2"/>
      {/* Arrow showing no abduction */}
      <path d="M40 75 Q28 60 32 45" stroke="#EF4444" strokeWidth="1.5" fill="none" strokeDasharray="4,2"/>
      <line x1="32" y1="45" x2="28" y2="52" stroke="#EF4444" strokeWidth="1.5"/>
      <text x="80" y="190" textAnchor="middle" fontSize="9" fill="#6B7280">Paralisia do Deltóide</text>
    </svg>
  );
}

function FootDrop() {
  return (
    <svg viewBox="0 0 120 220" width="120" height="220">
      {/* Lower leg */}
      <rect x="44" y="10" width="32" height="100" rx="16" fill="#F5CBA7" stroke="#D4A574" strokeWidth="1.5"/>
      {/* Ankle drooped */}
      <path d="M44 110 Q60 135 76 110" fill="#F5CBA7" stroke="#D4A574" strokeWidth="1.5"/>
      {/* Foot plantar-flexed / dropped */}
      <path d="M46 118 Q44 150 60 165 Q75 178 82 160 Q90 142 76 120" fill="#F5CBA7" stroke="#D4A574" strokeWidth="1.5"/>
      {/* Dorsal sensory highlight */}
      <ellipse cx="63" cy="148" rx="16" ry="10" fill="rgba(239,68,68,0.25)" stroke="#EF4444" strokeWidth="1" strokeDasharray="3,2"/>
      {/* Fibular head mark */}
      <circle cx="76" cy="110" r="6" fill="rgba(239,68,68,0.3)" stroke="#EF4444" strokeWidth="1.5"/>
      <text x="89" y="114" fontSize="8" fill="#EF4444">Cab. Fíbula</text>
      <text x="60" y="210" textAnchor="middle" fontSize="9" fill="#6B7280">Foot Drop</text>
    </svg>
  );
}

function PlantarLoss() {
  return (
    <svg viewBox="0 0 120 220" width="120" height="220">
      {/* Lower leg */}
      <rect x="44" y="10" width="32" height="100" rx="16" fill="#F5CBA7" stroke="#D4A574" strokeWidth="1.5"/>
      {/* Foot in neutral (can't plantarflex) */}
      <path d="M44 110 Q60 118 76 110" fill="#F5CBA7" stroke="#D4A574" strokeWidth="1.5"/>
      <path d="M44 118 Q38 145 42 165 Q46 178 60 180 Q75 182 80 168 Q86 150 80 122" fill="#F5CBA7" stroke="#D4A574" strokeWidth="1.5"/>
      {/* Plantar sensory highlight */}
      <ellipse cx="62" cy="168" rx="18" ry="10" fill="rgba(239,68,68,0.25)" stroke="#EF4444" strokeWidth="1" strokeDasharray="3,2"/>
      <text x="60" y="210" textAnchor="middle" fontSize="9" fill="#6B7280">Perda Flexão Plantar</text>
    </svg>
  );
}

function GenericUpper() {
  return (
    <svg viewBox="0 0 120 200" width="120" height="200">
      <rect x="44" y="10" width="32" height="90" rx="16" fill="#F5CBA7" stroke="#D4A574" strokeWidth="1.5"/>
      <rect x="36" y="96" width="48" height="40" rx="8" fill="#F5CBA7" stroke="#D4A574" strokeWidth="1.5"/>
      <rect x="38" y="55" width="8" height="32" rx="4" fill="#F5CBA7" stroke="#D4A574" strokeWidth="1.5"/>
      <rect x="49" y="49" width="8" height="38" rx="4" fill="#F5CBA7" stroke="#D4A574" strokeWidth="1.5"/>
      <rect x="60" y="47" width="8" height="40" rx="4" fill="#F5CBA7" stroke="#D4A574" strokeWidth="1.5"/>
      <rect x="71" y="50" width="8" height="37" rx="4" fill="#F5CBA7" stroke="#D4A574" strokeWidth="1.5"/>
      <rect x="80" y="56" width="7" height="32" rx="3.5" fill="#F5CBA7" stroke="#D4A574" strokeWidth="1.5"/>
      <ellipse cx="60" cy="100" rx="22" ry="12" fill="rgba(239,68,68,0.2)" stroke="#EF4444" strokeWidth="1" strokeDasharray="3,2"/>
      <text x="60" y="190" textAnchor="middle" fontSize="9" fill="#6B7280">Membro Superior</text>
    </svg>
  );
}

const DIAGRAMS = {
  wrist_drop: WristDrop,
  hand_benediction: HandBenediction,
  claw_hand: ClawHand,
  deltoid_paralysis: DeltoidParalysis,
  foot_drop: FootDrop,
  plantar_loss: PlantarLoss,
  default_upper: GenericUpper,
  default_lower: FootDrop,
};

export default function NeuroDiagram({ visual, limb }) {
  const key = visual || (limb === 'upper' ? 'default_upper' : 'default_lower');
  const Component = DIAGRAMS[key] || GenericUpper;
  return (
    <div className="flex items-center justify-center p-4">
      <Component />
    </div>
  );
}