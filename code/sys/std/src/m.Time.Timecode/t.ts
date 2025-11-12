import type { t } from './common.ts';

export type * from './composite/t.ts';
export type * from './ops/t.ts';
export type * from './slice/t.ts';
export type * from './t.lib.ts';

/**
 * Branded media timecode:
 * - MM:SS
 * - HH:MM:SS
 * - HH:MM:SS.mmm
 * Standard:
 *    WebVTT: The Web Video Text Tracks Format (W3C Recommendation)
 */
export type VttTimecode = string & { readonly __vtt: 'VttTimecode' };

/** Lexical kind discriminator for valid timecodes. */
export type TimecodeKind = 'MM:SS' | 'HH:MM:SS' | 'HH:MM:SS.mmm';

/** A single validated timecode entry with canonical milliseconds and associated data. */
export type TimecodeEntry<T = unknown> = {
  readonly tc: VttTimecode; //  validated key
  readonly ms: t.Msecs; //      numeric canonical
  readonly data: T;
};

/** A record of unvalidated timecode keys mapped to arbitrary data. */
export type TimecodeMap<T = unknown> = { readonly [HH_MM_SS_mmm: string]: T };
