import { Files, type t } from './common.ts';

/** Ask the sample file service what exists right now. */
export async function readFilesSnapshot(
  client: t.Files.Client.WebSocket,
  url: t.StringUrl | URL,
  path: t.Files.String.Path,
) {
  // Edge learned: only readText has a high-level Files.Client method today.
  // Keep capability/list/manifest/watch probing on the typed Cmd<T> escape hatch until the API is designed.
  const capabilities = await client.cmd.send(Files.Cmd.Name.capabilities, {});
  const list = await client.cmd.send(Files.Cmd.Name.list, {});
  const manifest = await client.cmd.send(Files.Cmd.Name.manifest, { content: true });
  const text = await client.readText(path);

  return { url: String(url), path, capabilities, list, manifest, text };
}
