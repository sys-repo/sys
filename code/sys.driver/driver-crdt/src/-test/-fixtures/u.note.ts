import type { t } from '../common.ts';

/** Each control gets the same values, not the same mutable object. */
export function initialNote(): t.FixtureNote {
  return {
    title: 'Note',
    items: [{ id: 'A', label: 'Alpha' }, { id: 'B', label: 'Beta' }],
    text: 'ac',
  };
}
