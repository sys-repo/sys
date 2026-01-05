import { type t, Http, PlaybackSchema } from './common.ts';

/**
 * Load a t.TimecodePlaybackDriver.Wire.Bundle from a running `publish.assets` server.
 *
 * Wires:
 * - MediaResolver (via the assets manifest)
 * - Timecode timeline spec (via the playback/timeline manifest)
 */
export async function loadTimelineFromEndpoint(
  baseUrl: t.StringUrl,
  docid: t.StringId,
): Promise<t.TimecodePlaybackDriver.Wire.Bundle<unknown>> {
  const http = Http.fetcher();

  // 1. Touch dist.json (kept for potential routing/metadata; unused for now).
  const distRes = await http.json(`${baseUrl}/manifests/dist.json`);
  void distRes;

  // 2. Assets manifest for this slug/doc.
  const assetsRes = await http.json(`${baseUrl}/manifests/slug.${docid}.assets.json`);
  const assets = assetsRes.data as t.TimecodePlaybackDriver.Wire.AssetsManifest;

  // 3. Timeline manifest (timecode spec) for this slug/doc.
  const timelineRes = await http.json(`${baseUrl}/manifests/slug.${docid}.playback.json`);

  // Payload is intentionally unconstrained at this layer.
  const payload = undefined;
  const parsed = PlaybackSchema.Manifest.parse(timelineRes.data, payload);
  if (!parsed.ok) {
    const reason = parsed.errors.map((e) => `${e.path}: ${e.message}`).join('; ');
    throw new Error(`Playback manifest failed @sys/schema validation. Reason: ${reason}`);
  }
  if (parsed.value.docid !== docid) {
    // Optional sanity check: requested docid matches wire docid.
    const err = `Playback manifest docid mismatch. Expected: ${docid}. Got: ${parsed.value.docid}`;
    throw new Error(err);
  }

  const manifest = parsed.value;

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
