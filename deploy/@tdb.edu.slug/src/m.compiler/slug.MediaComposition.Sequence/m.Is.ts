import { type t, Is } from '../common.ts';

type O = Record<string, unknown>;

export const SequenceIs: t.SequenceIsLib = {
  itemLike(value: unknown): value is t.SequenceItem {
    if (!Is.record(value)) return false;
    const o = value as O;
    if (typeof o.video === 'string') return true;
    if (typeof o.slug === 'string') return true;
    if (typeof o.pause === 'string') return true;
    if (typeof o.image === 'string') return true;
    return false;
  },
};
