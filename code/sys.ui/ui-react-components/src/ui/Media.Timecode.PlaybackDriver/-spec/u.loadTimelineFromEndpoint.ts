import { type t, AssetsSchema, Http, PlaybackSchema } from './common.ts';

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
  const fetch = Http.fetcher();

  async function fetchJsonManifest<T>(url: string): Promise<T> {
    const res = await fetch.json<T>(url, manifestInit);
    if (!res.ok) throw new Error(`Manifest fetch failed. ${res.status} ${res.statusText} @ ${url}`);
    return res.data as T;
  }

  // 1. Touch dist.json (kept for potential routing/metadata; unused for now).
  const distRes = await fetch.json(`${baseUrl}/manifests/dist.json`, manifestInit);
  void distRes;

  // 2. Assets manifest for this slug/doc.
  const assetsUrl = `${baseUrl}/manifests/slug.${docid}.assets.json`;
  const assetsJson = await fetchJsonManifest<unknown>(assetsUrl);

  // 3. Timeline manifest (timecode spec) for this slug/doc.
  const timelineUrl = `${baseUrl}/manifests/slug.${docid}.playback.json`;
  const timelineJson = await fetchJsonManifest<unknown>(timelineUrl);

  const assetsParsed = AssetsSchema.Manifest.parse(assetsJson);
  if (!assetsParsed.ok) {
    const reason = assetsParsed.errors.map((e) => `${e.path}: ${e.message}`).join('; ');
    throw new Error(`Assets manifest failed @sys/schema validation. Reason: ${reason}`);
  }
  if (assetsParsed.value.docid !== docid) {
    const err = `Assets manifest docid mismatch. Expected: ${docid}. Got: ${assetsParsed.value.docid}`;
    throw new Error(err);
  }

  const assets = assetsParsed.value;

  // Payload is intentionally unconstrained at this layer.
  const payload = undefined;
  const parsed = PlaybackSchema.Manifest.parse(timelineJson, payload);
  if (!parsed.ok) {
    const reason = parsed.errors.map((e) => `${e.path}: ${e.message}`).join('; ');
    throw new Error(`Playback manifest failed @sys/schema validation. Reason: ${reason}`);
  }
  if (parsed.value.docid !== docid) {
    const err = `Playback manifest docid mismatch. Expected: ${docid}. Got: ${parsed.value.docid}`;
    throw new Error(err);
  }

  const manifest = parsed.value;

  // 4. Media resolver from the assets manifest.
  const base = new URL(baseUrl);
  const basePath = base.pathname.replace(/\/$/, '');
  const assetMap = new Map<string, t.TimecodePlaybackDriver.Wire.Asset>();

  const normalizeHref = (href: string) => {
    if (href.startsWith('http://') || href.startsWith('https://')) return href;
    if (href.startsWith('/')) return new URL(`${basePath}${href}`, base.origin).toString();
    return new URL(href, baseUrl).toString();
  };

  for (const asset of assets.assets) {
    const key = `${asset.kind}:${asset.logicalPath}`;
    assetMap.set(key, { ...asset, href: normalizeHref(asset.href) });
  }

  const resolveAsset = (args: t.Timecode.Playback.ResolverArgs) => {
    return assetMap.get(`${args.kind}:${args.logicalPath}`);
  };

  // 5. Timecode spec wired directly from the manifest.
  const spec: t.Timecode.Playback.Spec<unknown> = {
    composition: manifest.composition,
    beats: manifest.beats,
  };

  return { docid, spec, resolveAsset };
}
