import type { t } from './common.ts';

/**
 * Sync Monaco's diagnostics with a YAML parse-run.
 *
 *   - Replaces **all** previous markers for this model + owner (`'yaml'`).
 *   - Draws red squiggly underlines, gutter ❌, and ruler bars
 *     for each `YamlError` in `errors`.
 *   - When `errors` is empty the underline set is cleared.
 */
export type UseYamlErrorMarkers = (args: UseYamlErrorMarkersArgs) => void;

/** Arguments passed to the `useErrorMarkers` hook. */
export type UseYamlErrorMarkersArgs = {
  enabled?: boolean;
  monaco?: t.Monaco.Monaco;
  editor?: t.Monaco.Editor;
  errors?: readonly t.YamlError[];
};
