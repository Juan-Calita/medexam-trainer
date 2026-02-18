export const MUSCLES = [
  {
    id: 'medial_rectus',
    name: 'Reto Medial',
    nerve: 'NC III (Oculomotor)',
    action: 'Adução (move o olho nasalmente)',
    failedDirection: 'adduction',
    explanation:
      'O reto medial é inervado pelo NC III (Oculomotor). A lesão causa falha na adução — o olho desvia lateralmente em repouso (exotropia) e não consegue cruzar a linha média em direção ao nariz. A diplopia é horizontal, pior ao olhar para o lado oposto (quando a adução seria necessária). Lesões do NC III frequentemente acompanham ptose e alterações pupilares.',
    difficulty: ['basic', 'intermediate', 'advanced'],
  },
  {
    id: 'lateral_rectus',
    name: 'Reto Lateral',
    nerve: 'NC VI (Abducente)',
    action: 'Abdução (move o olho temporalmente)',
    failedDirection: 'abduction',
    explanation:
      'O reto lateral é inervado pelo NC VI (Abducente). A lesão causa falha na abdução — o olho afetado não consegue se mover para fora e desvia medialmente em repouso (esotropia). A diplopia é horizontal, pior ao olhar para o lado do olho afetado e ao olhar para longe. O paciente frequentemente vira a cabeça para o lado do olho afetado para compensar.',
    difficulty: ['basic', 'intermediate', 'advanced'],
  },
  {
    id: 'superior_rectus',
    name: 'Reto Superior',
    nerve: 'NC III (Oculomotor)',
    action: 'Elevação (principalmente em abdução)',
    failedDirection: 'elevation',
    explanation:
      'O reto superior é inervado pelo NC III (Oculomotor). Sua ação de elevação é mais pura quando o olho está em abdução. A lesão resulta em dificuldade de elevar o olho, com tendência a hipotropia (olho mais baixo) em repouso. A diplopia é vertical, pior ao olhar para cima, especialmente com o olho afetado em abdução.',
    difficulty: ['intermediate', 'advanced'],
  },
  {
    id: 'inferior_rectus',
    name: 'Reto Inferior',
    nerve: 'NC III (Oculomotor)',
    action: 'Depressão (principalmente em abdução)',
    failedDirection: 'depression',
    explanation:
      'O reto inferior é inervado pelo NC III (Oculomotor). Sua ação de depressão é mais pura quando o olho está em abdução. A lesão causa dificuldade de deprimir o olho, com tendência a hipertropia (olho mais alto) em repouso. A diplopia é vertical, pior ao olhar para baixo, especialmente com o olho afetado em abdução.',
    difficulty: ['intermediate', 'advanced'],
  },
  {
    id: 'superior_oblique',
    name: 'Oblíquo Superior',
    nerve: 'NC IV (Troclear)',
    action: 'Intorção + Depressão em adução',
    failedDirection: 'depression_adduction',
    explanation:
      'O oblíquo superior é inervado pelo NC IV (Troclear). Suas funções principais são depressão em adução e intorção. A lesão manifesta-se como dificuldade de deprimir o olho ao olhar para baixo e para dentro — a queixa clássica é dificuldade ao descer escadas ou ler. Em repouso, há hipertropia do olho afetado com componente torsional. O paciente inclina a cabeça para o lado oposto ao olho afetado (head tilt compensatório). O Teste de Bielschowsky é positivo: a hipertropia piora ao inclinar a cabeça para o lado do olho afetado.',
    difficulty: ['advanced'],
  },
  {
    id: 'inferior_oblique',
    name: 'Oblíquo Inferior',
    nerve: 'NC III (Oculomotor)',
    action: 'Extorção + Elevação em adução',
    failedDirection: 'elevation_adduction',
    explanation:
      'O oblíquo inferior é inervado pelo NC III (Oculomotor). Suas funções principais são elevação em adução e extorção. A lesão causa dificuldade de elevar o olho quando este está em adução (olhar para cima e para dentro). A diplopia é vertical, pior ao olhar para cima e para dentro. Em repouso, pode haver tendência a hipotropia do olho afetado.',
    difficulty: ['advanced'],
  },
];

export function getMusclesForDifficulty(difficulty) {
  return MUSCLES.filter(m => m.difficulty.includes(difficulty));
}

export function getImpairedMovement(muscle) {
  if (!muscle) return null;
  return muscle.failedDirection;
}