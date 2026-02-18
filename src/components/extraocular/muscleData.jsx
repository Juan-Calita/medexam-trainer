export const MUSCLES = [
  {
    id: 'medial_rectus',
    name: 'Medial Rectus',
    nerve: 'CN III (Oculomotor)',
    action: 'Adduction (moves eye nasally)',
    failedDirection: 'adduction', // cannot move inward
    explanation:
      'O reto medial é inervado pelo NC III. Uma lesão causa falha na adução — o olho desvia lateralmente em repouso e não consegue cruzar a linha média em direção ao nariz.',
    difficulty: ['basic', 'intermediate', 'advanced'],
  },
  {
    id: 'lateral_rectus',
    name: 'Lateral Rectus',
    nerve: 'CN VI (Abducens)',
    action: 'Abduction (moves eye temporally)',
    failedDirection: 'abduction',
    explanation:
      'O reto lateral é inervado pelo NC VI (nervo abducente). Uma lesão resulta em falha na abdução — o olho não consegue se mover para fora e desvia medialmente em repouso.',
    difficulty: ['basic', 'intermediate', 'advanced'],
  },
  {
    id: 'superior_rectus',
    name: 'Superior Rectus',
    nerve: 'CN III (Oculomotor)',
    action: 'Elevation (mainly in abduction)',
    failedDirection: 'elevation',
    explanation:
      'O reto superior é inervado pelo NC III. Sua ação primária é a elevação, especialmente quando o olho está em abdução. Uma lesão compromete o olhar para cima.',
    difficulty: ['intermediate', 'advanced'],
  },
  {
    id: 'inferior_rectus',
    name: 'Inferior Rectus',
    nerve: 'CN III (Oculomotor)',
    action: 'Depression (mainly in abduction)',
    failedDirection: 'depression',
    explanation:
      'The inferior rectus is innervated by CN III. It depresses the eye, especially in abduction. A lesion impairs downward gaze.',
    difficulty: ['intermediate', 'advanced'],
  },
  {
    id: 'superior_oblique',
    name: 'Superior Oblique',
    nerve: 'CN IV (Trochlear)',
    action: 'Intorsion + Depression in adduction',
    failedDirection: 'depression_adduction',
    explanation:
      'The superior oblique is innervated by CN IV (Trochlear nerve). Its main clinical action is depression when the eye is adducted. Lesion causes vertical diplopia worsening on looking down and inward — the eye cannot depress in adduction.',
    difficulty: ['advanced'],
  },
  {
    id: 'inferior_oblique',
    name: 'Inferior Oblique',
    nerve: 'CN III (Oculomotor)',
    action: 'Extorsion + Elevation in adduction',
    failedDirection: 'elevation_adduction',
    explanation:
      'The inferior oblique is innervated by CN III. Its main clinical action is elevation when the eye is adducted. Lesion impairs upward gaze when the eye is looking inward.',
    difficulty: ['advanced'],
  },
];

export function getMusclesForDifficulty(difficulty) {
  return MUSCLES.filter(m => m.difficulty.includes(difficulty));
}

// Returns movement constraint for the impaired eye
// Returns an object with blocked directions
export function getImpairedMovement(muscle) {
  if (!muscle) return null;
  return muscle.failedDirection;
}