import type { t } from '../common.ts';
import { is } from './u.is.ts';
import { parse } from './u.parse.ts';

/**
 * Convert a record of timestamp-like keys into
 * a sorted array of validated timecode entries.
 */
export const toEntries = <T>(bag: Readonly<Record<string, T>>): readonly t.TimecodeEntry<T>[] => {
  const isVtt = (e: [string, T]): e is [t.VttTimecode, T] => is(e[0]);
  return Object.entries(bag)
    .filter(isVtt)
    .map(([tc, data]) => ({ tc, ms: parse(tc), data }))
    .sort((a, b) => a.ms - b.ms);
};
