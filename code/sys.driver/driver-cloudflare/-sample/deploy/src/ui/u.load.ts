import { Fetch, Hash, Is, Json, Pkg, type t } from './common.ts';

/**
 * Load the API, bundle total, and both manifests independently, without credentials or redirects.
 */
export function startFetches(
  origin: string,
  publicManifestUrl: string,
  onMessage: (value: string) => void,
  onManifest: (audience: t.Audience, digest: string, checksum: string, size?: number) => void,
  onBundleSize: (size?: number) => void,
): () => void {
  const client = Fetch.make({
    policy: {
      maxBytes: 65_536,
      timeout: 5_000,
      maxRedirects: 0,
      progressInterval: 100,
      sourceOrigins: [origin, new URL(publicManifestUrl).origin],
      credentialOrigins: [],
    },
  });

  async function json(path: string): Promise<unknown> {
    const response = await client.json<unknown>(new URL(path, origin));
    if (!response.ok) throw new Error('Request failed.');
    return response.data;
  }

  async function loadMessage() {
    const data = await json('/api/hello');
    if (!Is.record(data) || !Is.str(data.msg)) throw new Error('Invalid message.');
    if (!client.disposed) onMessage(data.msg);
  }

  async function loadBundleSize() {
    const data = await json('/api/bundle');
    if (
      !Is.record(data) || !Is.num(data.size) || !Number.isSafeInteger(data.size) || data.size < 0
    ) {
      throw new Error('Invalid bundle size.');
    }
    if (!client.disposed) onBundleSize(data.size);
  }

  async function loadManifest(audience: t.Audience) {
    const url = audience === 'private' ? new URL('/ui/dist.json', origin) : publicManifestUrl;
    const response = await client.blob(url);
    if (!response.ok) throw new Error('Request failed.');
    const bytes = new Uint8Array(await response.data.arrayBuffer());
    const data = Json.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    if (!Pkg.Is.dist(data)) throw new Error('Invalid Dist.');
    const size = data.build.size?.total;
    if (!Is.num(size) || !Number.isSafeInteger(size) || size < 0) {
      throw new Error('Invalid Dist size.');
    }
    // Hash the received bytes, not reserialized JSON; size describes the distribution payload.
    if (!client.disposed) onManifest(audience, data.hash.digest, Hash.sha256(bytes), size);
  }

  loadMessage().catch(() => {
    if (!client.disposed) onMessage('Could not load the message.');
  });
  loadBundleSize().catch(() => {
    if (!client.disposed) onBundleSize();
  });
  for (const audience of ['private', 'public'] as const) {
    loadManifest(audience).catch(() => {
      const message = `Could not load the ${audience} manifest.`;
      if (!client.disposed) onManifest(audience, message, message);
    });
  }

  return () => client.dispose();
}
