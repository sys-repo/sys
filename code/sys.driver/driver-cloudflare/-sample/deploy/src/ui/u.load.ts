import { Fetch, Is, Pkg } from './common.ts';

/**
 * Load the API message and Dist digest independently through one bounded same-origin client.
 */
export function startFetches(
  origin: string,
  onMessage: (value: string) => void,
  onDigest: (value: string) => void,
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

  async function loadDigest() {
    const data = await json('/ui/dist.json');
    if (!Pkg.Is.dist(data)) throw new Error('Invalid Dist.');
    if (!client.disposed) onDigest(data.hash.digest);
  }

  loadMessage().catch(() => {
    if (!client.disposed) onMessage('Could not load the message.');
  });
  loadDigest().catch(() => {
    if (!client.disposed) onDigest('Could not load the Dist digest.');
  });

  return () => client.dispose();
}
