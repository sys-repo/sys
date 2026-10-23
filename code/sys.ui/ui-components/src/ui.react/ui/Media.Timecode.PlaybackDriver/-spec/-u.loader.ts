import type { DebugSignals } from './-SPEC.Debug.tsx';
import { loadTimelineFromEndpoint } from './-u.loadTimelineFromEndpoint.ts';
import { resolveOriginUrls } from './-u.origin.ts';
import type { t } from './common.ts';

/**
 * Sample data.
 */
export const Sample = { load, unload } as const;

/**
 * Load sample.
 */
async function load(debug: DebugSignals, docid: t.StringId) {
  const p = debug.props;
  const urls = resolveOriginUrls(p.env.value);
  const bundle = await loadTimelineFromEndpoint(urls.app, urls.video, docid, {
    policy: {
      maxBytes: 64 * 1024 * 1024,
      timeout: 30_000,
      maxRedirects: 3,
      progressInterval: 100,
      sourceOrigins: [new URL(urls.app).origin],
      credentialOrigins: [],
    },
  });

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
