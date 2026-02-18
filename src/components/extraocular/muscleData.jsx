export const MUSCLES = [
  {
    id: 'medial_rectus',
    name: 'Reto Medial',
    nerve: 'NC III (Oculomotor)',
    action: 'Adução (move o olho nasalmente)',
    failedDirection: 'adduction', // cannot move inward
    explanation:
      'O reto medial é inervado pelo NC III. Uma lesão causa falha na adução — o olho desvia lateralmente em repouso e não consegue cruzar a linha média em direção ao nariz.',
    difficulty: ['basic', 'intermediate', 'advanced'],
  },
  {
    id: 'lateral_rectus',
    name: 'Reto Lateral',
    nerve: 'NC VI (Abducente)',
    action: 'Abdução (move o olho temporalmente)',
    failedDirection: 'abduction',
    explanation:
      'O reto lateral é inervado pelo NC VI (nervo abducente). Uma lesão resulta em falha na abdução — o olho não consegue se mover para fora e desvia medialmente em repouso.',
    difficulty: ['basic', 'intermediate', 'advanced'],
  },
  {
    id: 'superior_rectus',
    name: 'Reto Superior',
    nerve: 'NC III (Oculomotor)',
    action: 'Elevação (principalmente em abdução)',
    failedDirection: 'elevation',
    explanation:
      'O reto superior é inervado pelo NC III. Sua ação primária é a elevação, especialmente quando o olho está em abdução. Uma lesão compromete o olhar para cima.',
    difficulty: ['intermediate', 'advanced'],
  },
  {
    id: 'inferior_rectus',
    name: 'Reto Inferior',
    nerve: 'NC III (Oculomotor)',
    action: 'Depressão (principalmente em abdução)',
    failedDirection: 'depression',
    explanation:
      'O reto inferior é inervado pelo NC III. Ele deprime o olho, especialmente em abdução. Uma lesão compromete o olhar para baixo.',
    difficulty: ['intermediate', 'advanced'],
  },
  {
    id: 'superior_oblique',
    name: 'Oblíquo Superior',
    nerve: 'NC IV (Troclear)',
    action: 'Intorção + Depressão em adução',
    failedDirection: 'depression_adduction',
    explanation:
      'O oblíquo superior é inervado pelo NC IV (nervo troclear). Sua principal ação clínica é a depressão quando o olho está em adução. A lesão causa diplopia vertical que piora ao olhar para baixo e para dentro — o olho não consegue deprimir em adução.',
    difficulty: ['advanced'],
  },
  {
    id: 'inferior_oblique',
    name: 'Oblíquo Inferior',
    nerve: 'NC III (Oculomotor)',
    action: 'Extorção + Elevação em adução',
    failedDirection: 'elevation_adduction',
    explanation:
      'O oblíquo inferior é inervado pelo NC III. Sua principal ação clínica é a elevação quando o olho está em adução. A lesão compromete o olhar para cima quando o olho está voltado para dentro.',
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