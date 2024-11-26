const list = [
  'cartography',
  'catamaran',
  'sovereign',
  'soul',
  'hellacious',
  'helpful',
  'heretofore',
].sort();

export const Hints = {
  list,
  lookup(value: string) {
    const hint = list.find((item) => item.startsWith(value.toLowerCase()));
    return hint ? hint.substring(value.length) : '';
  },
} as const;
