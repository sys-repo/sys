import { type t, Http } from '../common.ts';

/**
 * Minimal manifest shape mirrored from the tools slug bundle.
 * UI only cares about the bits needed to resolve media.
 */
export type PublishAssetsManifest = {
  readonly docid: string;
  readonly assets: readonly {
    readonly kind: t.Timecode.Playback.MediaKind;
    readonly logicalPath: string; //  eg. '/:videos/p2p 3.1 ...'
    readonly href: string; //         eg. '/publish.assets/video/abc123.webm'
  }[];
};

/**
 * Playback manifest: timecode composition + beats emitted by the tools bundle.
 * Mirrors the JSON produced for the player.
 */
export type PublishPlaybackManifest = {
  readonly docid: string;
  readonly composition: t.Timecode.Composite.Spec;
  readonly beats: t.Timecode.Playback.Spec<unknown>['beats'];
};

/**
 * Load a playback bundle from a running `publish.assets` server.
 *
 * This now wires both:
 * - MediaResolver (via the assets manifest)
 * - TimecodePlaybackSpec (via the playback manifest)
 */
export async function loadPlaybackFromEndpoint(
  baseUrl: t.StringUrl,
  docid: t.StringId,
): Promise<t.MediaTimeline.PlaybackBundle> {
  const http = Http.fetcher();

  // 1. Load dist.json (you might use this later for routing; for now we just hit it).
  const distRes = await http.json(`${baseUrl}/manifests/dist.json`);
  const dist = distRes.data; // keep as unknown for now – no need to type it yet
  void dist; // placeholder to avoid eslint complaints

  // 2. Load the assets manifest for this slug/doc.
  const manifestRes = await http.json(`${baseUrl}/manifests/slug.${docid}.assets.json`);
  const manifest = manifestRes.data as PublishAssetsManifest;

  // 3. Load the playback manifest (timecode spec) for this slug/doc.
  const playbackRes = await http.json(`${baseUrl}/manifests/slug.${docid}.playback.json`);
  const playback = playbackRes.data as PublishPlaybackManifest;

  // 4. Build the MediaResolver from the manifest.
  const resolveMedia: t.MediaResolver = ({ kind, logicalPath }) => {
    const asset = manifest.assets.find((a) => a.kind === kind && a.logicalPath === logicalPath);
    if (!asset) return undefined;

    const base = new URL(baseUrl);
    const basePath = base.pathname.replace(/\/$/, ''); // "/publish.assets"
    let href = asset.href;

    // If href is root-relative ("/video/..."), anchor it under the publish.assets prefix.
    if (href.startsWith('/')) {
      href = `${basePath}${href}`; // "/publish.assets/video/..."
    }

    const url = new URL(href, base.origin);
    return url.toString();
  };

  // 5. Use the real timecode playback spec from the manifest.
  const spec: t.Timecode.Playback.Spec<unknown> = {
    composition: playback.composition,
    beats: playback.beats,
  };

  return { spec, resolveMedia };
}
