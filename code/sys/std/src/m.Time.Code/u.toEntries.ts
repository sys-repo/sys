import { type t } from './common.ts';
import { Timecode } from './mod.ts';
import { is } from './u.ts';

/**
 * Convert a record of timestamp-like keys into
 * a sorted array of validated timecode entries.
 */
export const toEntries = <T>(bag: Readonly<Record<string, T>>): readonly t.TimecodeEntry<T>[] => {
  const isVtt = (e: [string, T]): e is [t.VttTimecode, T] => is(e[0]);
  return Object.entries(bag)
    .filter(isVtt)
    .map(([tc, data]) => ({ tc, ms: Timecode.parse(tc), data }))
    .sort((a, b) => a.ms - b.ms);
};
