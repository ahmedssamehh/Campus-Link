// Shared helpers for presenting study groups consistently across screens.

export const groupInitials = (name = '') => {
  const words = name.split(/[\s\-_·.,:&/]+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

// Solid, app-icon style tones; a group always maps to the same one.
const TONES = [
  'bg-blue-600',
  'bg-indigo-500',
  'bg-teal-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-slate-600',
  'bg-sky-500',
  'bg-green-600',
];

export const groupTone = (key = '') => {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) | 0;
  return TONES[Math.abs(hash) % TONES.length];
};

/**
 * Tones for a list of groups shown together: each keeps its natural tone unless an
 * earlier group already took it, in which case it steps to the next free one.
 * Returns a Map of group id -> tone class.
 */
export const distinctGroupTones = (groups = []) => {
  const used = new Set();
  const map = new Map();
  groups.forEach((g) => {
    const start = TONES.indexOf(groupTone(g.name));
    let tone = TONES[start];
    for (let i = 0; i < TONES.length && used.has(tone); i++) {
      tone = TONES[(start + i + 1) % TONES.length];
    }
    used.add(tone);
    map.set(String(g._id || g.id), tone);
  });
  return map;
};
