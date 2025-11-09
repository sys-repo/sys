import type { t } from './common.ts';

export type * from './t.ops.ts';

/**
 * Branded media timecode:
 * - MM:SS
 * - HH:MM:SS
 * - HH:MM:SS.mmm
 */
export type VttTimecode = string & { readonly __vtt: 'VttTimecode' };

/** Lexical kind discriminator for valid timecodes. */
export type TimecodeKind = 'MM:SS' | 'HH:MM:SS' | 'HH:MM:SS.mmm';

/** A single validated timecode entry with canonical milliseconds and associated data. */
export type TimecodeEntry<T> = {
  readonly tc: VttTimecode; //  validated key
  readonly ms: t.Msecs; //      numeric canonical
  readonly data: T;
};

/** A record of unvalidated timecode keys mapped to arbitrary data. */
export type TimecodeMap<T> = {
  readonly [key: string]: T;
};
