import { type t } from './common.ts';

/** Ask the sample file service what exists right now. */
export async function readFilesSnapshot(
  client: t.Files.Client.WebSocket,
  url: t.StringUrl | URL,
  path: t.Files.String.Path,
) {
  const capabilities = await client.capabilities();
  const list = await client.list();
  const manifest = await client.manifest({ contentRefs: true });
  const text = await client.readText(path);

  return { url: String(url), path, capabilities, list, manifest, text };
}
