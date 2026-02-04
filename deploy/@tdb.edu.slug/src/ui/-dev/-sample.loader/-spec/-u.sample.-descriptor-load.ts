import { type FetchActionArgs, SlugClient } from './-common.ts';

/**
 * Load descriptor manifest from origin.
 */
export async function sampleDescriptorLoad(e: FetchActionArgs) {
  const path = e.local ? 'staging/cdn.slc.db.team/kb/-manifests' : 'kb/-manifests';
  const res = await SlugClient.FromEndpoint.Descriptor.load(e.origin.cdn.default, path);
  e.result(res);
}
