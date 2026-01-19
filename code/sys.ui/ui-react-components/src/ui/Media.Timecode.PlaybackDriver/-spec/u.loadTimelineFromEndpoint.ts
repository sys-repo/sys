import { type t } from './common.ts';
import { SlugClient } from '@sys/driver-slug';

/**
 * Load a t.TimecodePlaybackDriver.Wire.Bundle from a running `publish.assets` server.
 *
 * Wires:
 * - Asset resolver (via the assets manifest)
 * - Timecode timeline spec (via the playback/timeline manifest)
 */
export async function loadTimelineFromEndpoint(
  baseUrl: t.StringUrl,
  docid: t.StringId,
): Promise<t.TimecodePlaybackDriver.Wire.Bundle<unknown>> {
  /**
   * Manifest fetch hardening:
   * - These JSON manifests are small and frequently rewritten.
   * - We require cache correctness over “helpful” cache reuse.
   *
   * Use RequestInit.cache='no-cache' to force revalidation (ETag/304 still works)
   * without adding custom request headers that can trigger CORS preflight.
   */
  const manifestInit: RequestInit = { cache: 'no-cache' };
  const result = await SlugClient.loadBundleFromEndpoint(baseUrl, docid, { init: manifestInit });
  if (!result.ok) {
    if (result.error.kind === 'http') {
      throw new Error(
        `Manifest fetch failed. ${result.error.status} ${result.error.statusText} @ ${result.error.url}`,
      );
    }
    throw new Error(result.error.message);
  }

  return result.value;
}
