/** Only fields with special height behavior need an identity. */
export type ServiceRowKind = 'title' | 'main' | 'secondary' | 'error';

/** Padded physical lines and the value that follows the first line's label. */
export type FittedRow = {
  readonly kind?: ServiceRowKind;
  readonly lines: readonly string[];
  readonly firstValue: string;
  /** Gap cells already included at the start of firstValue. */
  readonly markerCells: number;
};

/** Preserve service membership and its original URL label across fitting. */
export type ServiceSection<R> = {
  readonly name: string;
  readonly rows: readonly R[];
  readonly urlLabel?: number;
};
