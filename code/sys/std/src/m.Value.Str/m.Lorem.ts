import type { t } from './common.ts';

const LOREM = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque nec quam lorem. Praesent fermentum, augue ut porta varius, eros nisl euismod ante, ac suscipit elit libero nec dolor. Morbi magna enim, molestie non arcu id, varius sollicitudin neque. In sed quam mauris. Aenean mi nisl, elementum non arcu quis, ultrices tincidunt augue. Vivamus fermentum iaculis tellus finibus porttitor. Nulla eu purus id dolor auctor suscipit. Integer lacinia sapien at ante tempus volutpat.`;

export const Lorem: t.StrLoremLib = {
  get text() {
    return LOREM;
  },

  toString() {
    return LOREM;
  },

  words(count) {
    if (count < 0) return '';
    const list = LOREM.split(/\s+/).filter((word) => word.length > 0);
    const repeats = Math.ceil(count / list.length);
    const repeatedWords = Array(repeats).fill(list).flat();
    const result = repeatedWords.slice(0, count).join(' ').trim();
    return result && !result.endsWith('.') ? result + '.' : result;
  },
};
