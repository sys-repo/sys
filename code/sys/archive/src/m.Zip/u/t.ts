import type { t } from '../common.ts';

/** Captured options shared only by ZIP operation owners. */
export type WorkInput = { readonly until?: t.UntilInput; readonly timeout: t.Msecs };
export type OpenInput = WorkInput & { readonly limits: t.Zip.Limits };

/** Internal owner checkpoints; errors remain authenticated by the ZIP operation. */
export type OperationContext = {
  readonly operation: t.Zip.Operation;
  readonly limits: t.Zip.Limits;
  readonly signal: AbortSignal;
  readonly checkpoint: (entryIndex?: number) => void;
  readonly yieldTurn: (entryIndex?: number) => Promise<void>;
};

/** Parsed offsets never cross the public archive boundary. */
export type ParsedEntry = { readonly metadata: t.Zip.Entry; readonly dataOffset: number };
export type ParsedArchive = {
  readonly entries: readonly ParsedEntry[];
  readonly inspection: t.Zip.Inspection;
};

/** Internal native write seam for backpressure tests. */
export type InflaterWriter = {
  write(bytes: Uint8Array, callback: (error?: Error | null) => void): boolean;
  once(event: string, listener: (cause?: unknown) => void): unknown;
  removeListener(event: string, listener: (cause?: unknown) => void): unknown;
};

/** Shared counters are scoped to one full payload pass. */
export type PayloadPass = {
  read(entry: ParsedEntry, context: OperationContext): AsyncGenerator<Uint8Array>;
};

/** A source holds no public authority beyond its operation-scoped iterable. */
export type ExtractionSource = {
  readonly content: AsyncIterable<Uint8Array>;
  readonly complete: () => boolean;
  readonly stop: () => Promise<void>;
};

/** Private coordination shared by one sink invocation and its content sources. */
export type ExtractionControl = {
  readonly context: OperationContext;
  readonly check: (entryIndex?: number) => void;
  readonly fail: (
    kind: t.Zip.Failure.Kind,
    entryIndex?: number,
    cause?: unknown,
  ) => t.Zip.Failure.Error;
  readonly payloadFailure: (cause: unknown, entryIndex: number) => t.Zip.Failure.Error;
  readonly claim: (ordinal: number) => void;
  readonly completed: () => void;
};
