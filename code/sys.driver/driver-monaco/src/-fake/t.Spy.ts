import type { t } from './common.ts';

/**
 * Collection of small test spies for Monaco editor globals.
 */
export type SpyLib = {
  /**
   * Wraps `monaco.editor.setModelMarkers` and records invocations
   * until `restore()` is called.
   */
  forSetModelMarkers(monaco: t.Monaco.Monaco): SetModelMarkersSpy;
};

/**
 * Signature and call-shape for `monaco.editor.setModelMarkers`.
 */
export type SetModelMarkersFn = t.Monaco.Monaco['editor']['setModelMarkers'];
export type SetModelMarkersArgs = Parameters<SetModelMarkersFn>;
export type SetModelMarkersCall = { readonly args: SetModelMarkersArgs };

/**
 * Handle returned by a spy. Restorable and queryable.
 */
export type SetModelMarkersSpy = {
  /** All captured invocations in call order. */
  readonly calls: readonly SetModelMarkersCall[];

  /** Convenience accessor for the markers array of a given call (defaults to last). */
  getMarkers(i?: number): readonly t.Monaco.I.IMarkerData[];

  /** Restore the original implementation. */
  restore(): void;
};
