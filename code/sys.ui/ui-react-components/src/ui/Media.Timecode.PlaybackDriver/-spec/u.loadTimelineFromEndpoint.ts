import { SlugClient } from '@sys/driver-slug/client';
import { type t } from './common.ts';

export async function loadTimelineFromEndpoint(
  baseUrl: t.StringUrl,
  docid: t.StringId,
): Promise<t.TimecodePlaybackDriver.Wire.Bundle<unknown>> {
  const init: RequestInit = { cache: 'no-cache' };
  const res = await SlugClient.FromEndpoint.Bundle.load(baseUrl, docid, { init });
  if (!res.ok) SlugClient.Error.throw(res.error);
  return res.value;
}
