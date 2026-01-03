import type { DebugSignals } from './-SPEC.Debug.tsx';
import { type t, D } from './common.ts';
import { loadTimelineFromEndpoint } from './u.loadTimelineFromEndpoint.ts';

/**
 * Sample data.
 */
export const Sample = { load, unload } as const;

/**
 * Load sample.
 */
async function load(debug: DebugSignals, docid: t.StringId) {
  const p = debug.props;

  /**
   * SAMPLE 🐷
   */
  const url = p.baseUrl.value || D.DEV.baseUrl;
  const bundle = await loadTimelineFromEndpoint(url, docid);

  /** Update state. */
  p.docid.value = docid;
  p.bundle.value = bundle;
}

/**
 * Unload sample.
 */
function unload(debug: DebugSignals) {
  const decks = debug.decks;
  const p = debug.props;

  p.docid.value = undefined;
  p.bundle.value = undefined;
  decks.A.props.src.value = undefined;
  decks.B.props.src.value = undefined;
}
