import type { t } from './common.ts';

/**
 * Canonical resolved timeline with attached diagnostic intelligence.
 * Merges structural result with self-reflective status meta.
 */
export type TimecodeResolved = t.TimecodeCompositionResolved & TimecodeResolutionMeta;

/** -----------------------------------------------------------------------------
 * Parts:
 */

/** Severity level for timeline diagnostics. */
export type TimecodeIssueSeverity = 'info' | 'warn' | 'error';

/** Diagnostic events emitted by the virtual timeline builder and related ops. */
export type TimecodeIssue =
  | {
      readonly kind: 'invalid-slice';
      readonly severity: 'error';
      readonly src: t.StringRef;
      readonly slice: string;
    }
  | {
      readonly kind: 'zero-length-segment';
      readonly severity: 'warn';
      readonly src: t.StringRef;
    }
  | {
      readonly kind: 'unresolved-length';
      readonly severity: 'error';
      readonly src: t.StringRef;
      readonly slice?: string;
    }
  | {
      readonly kind: 'dropped-segment';
      readonly severity: 'info' | 'warn';
      readonly src: t.StringRef;
      readonly reason: 'invalid-slice' | 'zero-length' | 'missing-src' | 'unresolved-length';
    };

/** Neutral counters for telemetry, UI summaries, and tests. */
export type TimecodeResolutionStats = {
  readonly pieces: number; // input spec length
  readonly segments: number; // output count
  readonly dropped: number; // skipped/dropped pieces
  readonly absSlices: number; // absolute "START..END"
  readonly open: { readonly start: number; readonly end: number; readonly relEnd: number };
};

/** Meta attached to resolved compositions for quick UX + diagnostics. */
export type TimecodeResolutionMeta = {
  readonly is: { readonly empty: boolean; readonly valid: boolean };
  readonly issues: readonly TimecodeIssue[];
  readonly stats: TimecodeResolutionStats;
};
