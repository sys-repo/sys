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
 * Load a playback bundle from a running `publish.assets` server.
 *
 * NOTE: For the first iteration this returns an empty TimecodePlaybackSpec –
 * we only wire up the MediaResolver using the manifest.
 * The real timecode composition will get slotted in later.
 */
export async function loadPlaybackFromEndpoint(
  baseUrl: t.StringUrl,
  docid: t.StringId,
): Promise<t.MediaTimecode.PlaybackBundle> {
  const http = Http.fetcher();

  // 1. Load dist.json (you might use this later for routing; for now we just hit it).
  const distRes = await http.json(`${baseUrl}/manifests/dist.json`);
  const dist = distRes.data; // keep as unknown for now – no need to type it yet
  void dist; // placeholder to avoid eslint complaints

  // 2. Load a single manifest (for now: hard-code or swap in a debug docid).
  const manifestRes = await http.json(`${baseUrl}/manifests/slug.${docid}.assets.json`);
  const manifest = manifestRes.data as PublishAssetsManifest;

  // 3. Build the MediaResolver from the manifest.
  const resolveMedia: t.MediaResolver = ({ kind, logicalPath }) => {
    const asset = manifest.assets.find((a) => a.kind === kind && a.logicalPath === logicalPath);
    if (!asset) return undefined;

    // Ensure we always return an absolute URL rooted at `baseUrl`.
    const url = new URL(asset.href, `${baseUrl}/`);
    return url.toString();
  };

  // 4. Stub TimecodePlaybackSpec – composition + beats will be filled from
  //    real timecode data later.
  const spec: t.Timecode.Playback.Spec<unknown> = {
    composition: [] as t.Timecode.Composite.Spec,
    beats: [],
  };

  return { spec, resolveMedia };
}
