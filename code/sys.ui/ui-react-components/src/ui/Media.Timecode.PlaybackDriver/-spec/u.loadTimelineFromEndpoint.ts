import { type t } from './common.ts';
import { SlugClient } from '@sys/driver-slug/client';

const MANIFEST_INIT: RequestInit = { cache: 'no-cache' };

export async function loadTimelineFromEndpoint(
  baseUrl: t.StringUrl,
  docid: t.StringId,
): Promise<t.TimecodePlaybackDriver.Wire.Bundle<unknown>> {
  const r = await SlugClient.FromEndpoint.loadBundle(baseUrl, docid, { init: MANIFEST_INIT });
  if (!r.ok)
    throw new Error(
      r.error.kind === 'http'
        ? `Manifest fetch failed. ${r.error.status} ${r.error.statusText} @ ${r.error.url}`
        : r.error.message,
    );
  return r.value;
}
