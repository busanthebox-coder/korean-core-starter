const PARTICLES = [
  '까지', '부터', '처럼', '보다', '마다', '밖에', '한테', '에게', '께서', '께',
  '에서', '으로', '으로는', '으로도', '하고', '이랑', '랑', '와', '과',
  '은', '는', '이', '가', '을', '를', '에', '도', '만', '로', '의',
];

const PARTICLES_BY_LENGTH = PARTICLES.slice().sort((a, b) => b.length - a.length);

export const COPULA_ENDINGS = [
  '이었어요', '였어요', '이었지만', '였지만', '이었다', '였다',
  '이라고', '라고', '이에요', '예요', '입니다', '이다', '인', '다',
];

const TOKEN_EDGE = /^[\s"'“”‘’()[\]{}.,!?;:…·]+|[\s"'“”‘’()[\]{}.,!?;:…·]+$/g;

export function cleanGlossToken(raw) {
  return String(raw || '').replace(TOKEN_EDGE, '').trim();
}

export function stripParticle(token) {
  let clean = cleanGlossToken(token);
  if (!clean) return '';
  let changed = true;
  while (changed) {
    changed = false;
    for (const particle of PARTICLES_BY_LENGTH) {
      if (clean.length <= particle.length) continue;
      if (clean.endsWith(particle)) {
        clean = clean.slice(0, -particle.length);
        changed = true;
        break;
      }
    }
    if (clean.length > 2 && clean.endsWith('들')) {
      clean = clean.slice(0, -1);
      changed = true;
    }
  }
  return clean;
}
