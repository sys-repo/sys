import type { t } from './common.ts';

/**
 * Convert schema/YAML diagnostics into Monaco editor markers.
 */
export declare namespace EditorError {
  /** Runtime library surface. */
  export type Lib = {
    /** Map diagnostics to Monaco `IMarkerData`. */
    toMarkers(
      target: t.Monaco.TextModel | t.Monaco.Editor,
      errors: Diagnostic.Shape[],
    ): t.Monaco.I.IMarkerData[];

    /** Sync Monaco's visible error diagnostics. */
    useErrorMarkers: t.UseErrorMarkers;
  };

  /** Normalized editor diagnostics projected into Monaco markers. */
  export namespace Diagnostic {
    /** Diagnostic severity, matching Monaco.MarkerSeverity keys. */
    export type Severity = 'Error' | 'Warning' | 'Info' | 'Hint';

    /** An object representation of the severity levels. */
    export type SeverityConst = Record<NonNullable<Severity>, number>;

    /** Normalized diagnostic shape used by editor and driver layers. */
    export type Shape = {
      /** Human-readable problem description. */
      readonly message: string;

      /** Optional machine-readable error identifier (string or number). */
      readonly code?: string | number;

      /** Byte-offset positions within the source text. `[start, end)` */
      readonly pos?: readonly [number, number];

      /** Parser-style range `[start, valueEnd, nodeEnd?]`. */
      readonly range?: readonly [number, number, number?];

      /** Line/column coordinates (1-based). */
      readonly linePos?: readonly [t.LinePos, t.LinePos];

      /** Object path within document, e.g. `['spec', 'ports', 0]`. */
      readonly path?: t.ObjectPath;

      /** Severity normalized to Monaco’s four standard levels. */
      readonly severity?: Severity;
    };
  }
}
