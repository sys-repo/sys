import type { t } from './common.ts';

/**
 * Sync Monaco's visible error diagnostics.
 *
 *   - Replaces **all** previous markers for this model + owner
 *   - Draws red squiggly underlines, gutter ❌, and ruler bars
 *     for each `YamlError` in `errors`.
 *   - When `errors` is empty the underline set is cleared.
 */
export type UseErrorMarkers = (args: UseErrorMarkersArgs) => void;

/** Arguments passed to the `useErrorMarkers` hook. */
export type UseErrorMarkersArgs = {
  enabled?: boolean;
  owner?: string;
  monaco?: t.Monaco.Monaco;
  editor?: t.Monaco.Editor;
  errors?: t.EditorDiagnostic[];
};
