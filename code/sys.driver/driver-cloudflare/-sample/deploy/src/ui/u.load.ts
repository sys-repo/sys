import { Fetch, Hash, Is, Json, Pkg } from './common.ts';

/**
 * Load the API and private manifest independently through one bounded same-origin client.
 */
export function startFetches(
  origin: string,
  onMessage: (value: string) => void,
  onManifest: (digest: string, checksum: string) => void,
): () => void {
  const client = Fetch.make({
    policy: {
      maxBytes: 65_536,
      timeout: 5_000,
      maxRedirects: 0,
      progressInterval: 100,
      sourceOrigins: [origin],
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

  async function loadManifest() {
    const response = await client.blob(new URL('/ui/dist.json', origin));
    if (!response.ok) throw new Error('Request failed.');
    const bytes = new Uint8Array(await response.data.arrayBuffer());
    const data = Json.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
    if (!Pkg.Is.dist(data)) throw new Error('Invalid Dist.');
    // Hash the received bytes, not reserialized JSON or the manifest's reported payload digest.
    if (!client.disposed) onManifest(data.hash.digest, Hash.sha256(bytes));
  }

  loadMessage().catch(() => {
    if (!client.disposed) onMessage('Could not load the message.');
  });
  loadManifest().catch(() => {
    const message = 'Could not load the private manifest.';
    if (!client.disposed) onManifest(message, message);
  });

  return () => client.dispose();
}
