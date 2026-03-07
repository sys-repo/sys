import { SlugClient } from '@sys/model-slug/client';
import { type t } from './common.ts';
import { SHARD_LAYOUT } from './-u.origin.ts';

export async function loadTimelineFromEndpoint(
  appBaseUrl: t.StringUrl,
  videoBaseUrl: t.StringUrl,
  docid: t.StringId,
): Promise<t.TimecodePlaybackDriver.Wire.Bundle<unknown>> {
  const init: RequestInit = { cache: 'no-cache' };
  const res = await SlugClient.FromEndpoint.Timeline.Bundle.load(appBaseUrl, docid, {
    init,
    urls: { assetBase: videoBaseUrl },
    layout: SHARD_LAYOUT,
  });
  if (!res.ok) SlugClient.Error.throw(res.error);
  return res.value;
}
