import type { t } from './common.ts';

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
  readonly tc: VttTimecode; // validated key
  readonly ms: t.Msecs; // numeric canonical
  readonly data: T;
};

/** A record of unvalidated timecode keys mapped to arbitrary data. */
export type TimecodeRecord<T> = { readonly [key: string]: T };

/**
 * Public library surface for timecodes.
 * Implementation should provide a single frozen object matching this shape.
 */
export type TimecodeLib = {
  /** Regex pattern string for validation (HH optional, .mmm optional). */
  readonly pattern: string;

  /** Compiled RegExp of `pattern`. */
  readonly regex: RegExp;

  /** Type guard: true when input matches the grammar. */
  readonly is: (input: unknown) => input is VttTimecode;

  /** Return the lexical form of a valid timecode. */
  readonly kindOf: (timecode: string) => TimecodeKind;

  /** Parse a valid timecode to milliseconds. */
  readonly parse: (timecode: string) => t.Msecs;

  /**
   * Stable sort by time:
   * - valid timecodes first, ordered by time
   * - non-timecodes after, original relative order preserved
   */
  readonly sort: (timecodes: string[]) => readonly string[];

  /** Convert a record of timestamp-like keys to sorted validated entries. */
  readonly toEntries: <T>(bag: Readonly<Record<string, T>>) => readonly TimecodeEntry<T>[];

  /**
   * Format milliseconds into a minimal legal timecode.
   * - withMillis: include .mmm
   * - forceHours: emit HH:MM:SS even when HH === 0
   */
  readonly format: (
    ms: t.Msecs,
    opts?: { withMillis?: boolean; forceHours?: boolean },
  ) => VttTimecode;
};
