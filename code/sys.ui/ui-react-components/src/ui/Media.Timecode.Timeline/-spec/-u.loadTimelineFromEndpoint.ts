import { type t, Http } from '../common.ts';

/**
 * Load a SpecTimelineBundle from a running `publish.assets` server.
 *
 * Wires:
 * - MediaResolver (via the assets manifest)
 * - Timecode timeline spec (via the playback/timeline manifest)
 */
export async function loadTimelineFromEndpoint(
  baseUrl: t.StringUrl,
  docid: t.StringId,
): Promise<t.SpecTimelineBundle<unknown>> {
  const http = Http.fetcher();

  // 1. Touch dist.json (kept for potential routing/metadata; unused for now).
  const distRes = await http.json(`${baseUrl}/manifests/dist.json`);
  void distRes;

  // 2. Assets manifest for this slug/doc.
  const assetsRes = await http.json(`${baseUrl}/manifests/slug.${docid}.assets.json`);
  const assets = assetsRes.data as t.SpecTimelineAssetsManifest;

  // 3. Timeline manifest (timecode spec) for this slug/doc.
  const timelineRes = await http.json(`${baseUrl}/manifests/slug.${docid}.playback.json`);
  const manifest = timelineRes.data as t.SpecTimelineManifest<unknown>;

  // 4. Media resolver from the assets manifest.
  const resolveMedia: t.MediaResolver = ({ kind, logicalPath }) => {
    const asset = assets.assets.find((a) => a.kind === kind && a.logicalPath === logicalPath);
    if (!asset) return undefined;

    const base = new URL(baseUrl);
    const basePath = base.pathname.replace(/\/$/, ''); // eg. "/publish.assets"
    const href = asset.href.startsWith('/') ? `${basePath}${asset.href}` : asset.href;

    return new URL(href, base.origin).toString();
  };

  // 5. Timecode spec wired directly from the manifest.
  const spec: t.Timecode.Playback.Spec<unknown> = {
    composition: manifest.composition,
    beats: manifest.beats,
  };

  return {
    docid,
    spec,
    resolveMedia,
  };
}
