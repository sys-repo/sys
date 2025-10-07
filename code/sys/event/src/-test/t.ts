export type * from '../common/t.ts';

/** Canonical debug events for tests (hierarchical by kind). */
export type DebugEvent =
  | DebugBaseEvent //    ← kind: 'debug'
  | DebugAEvent //       ← kind: 'debug:a'
  | DebugABEvent //      ← kind: 'debug:a.b'
  | DebugABCEvent; //    ← kind: 'debug:a.b.c'

/** Level 0 (no prefix) — good for negative prefix checks. */
export type DebugBaseEvent = {
  readonly kind: 'debug';
  readonly msg?: string;
  readonly source?: string;
};

/** Level 1 under "debug:". */
export type DebugAEvent = {
  readonly kind: 'debug:a';
  readonly count: number;
  readonly text?: string;
};

/** Level 2 under "debug:a". */
export type DebugABEvent = {
  readonly kind: 'debug:a.b';
  readonly total: number;
  readonly note?: string;
};

/** Level 3 under "debug:a.b". */
export type DebugABCEvent = {
  readonly kind: 'debug:a.b.c';
  readonly flag: boolean;
};
