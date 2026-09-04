import { SlugClient } from '@sys/model-slug/client';
import type { SlugLoadTransport } from '@sys/model-slug/types';
import type { t } from './common.ts';
import { SHARD_LAYOUT } from './-u.origin.ts';

export async function loadTimelineFromEndpoint(
  appBaseUrl: t.StringUrl,
  videoBaseUrl: t.StringUrl,
  docid: t.StringId,
  transport: SlugLoadTransport,
): Promise<t.TimecodePlaybackDriver.Wire.Bundle<unknown>> {
  const init = { cache: 'no-cache' } as const;
  const res = await SlugClient.FromEndpoint.Timeline.Bundle.load(appBaseUrl, docid, {
    ...transport,
    init,
    urls: { assetBase: videoBaseUrl },
    layout: SHARD_LAYOUT,
  });
  if (!res.ok) SlugClient.Error.throw(res.error);
  return res.value;
}
