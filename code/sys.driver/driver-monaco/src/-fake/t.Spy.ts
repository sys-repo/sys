import type { t } from './common.ts';

/** Collection of small test spies for Monaco editor globals. */
export type Lib = {
  /** Wrap `monaco.editor.setModelMarkers` and record invocations until `restore()`. */
  forSetModelMarkers(monaco: t.Monaco.Monaco): Handle;
};

/** Signature for `monaco.editor.setModelMarkers`. */
export type MarkerSetter = t.Monaco.Monaco['editor']['setModelMarkers'];

/** Call arguments for `monaco.editor.setModelMarkers`. */
export type MarkerSetterArgs = Parameters<MarkerSetter>;

/** Captured `setModelMarkers` call. */
export type MarkerSetCall = { readonly args: MarkerSetterArgs };

/** Handle returned by a spy. Restorable and queryable. */
export type Handle = {
  /** All captured invocations in call order. */
  readonly calls: readonly MarkerSetCall[];

  /** Convenience accessor for the markers array of a given call (defaults to last). */
  getMarkers(index?: number): readonly t.Monaco.I.IMarkerData[];

  /** Restore the original implementation. */
  restore(): void;
};
