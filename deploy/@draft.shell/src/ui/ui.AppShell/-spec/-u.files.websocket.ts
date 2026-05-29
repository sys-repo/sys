import { Files, type t } from './common.ts';

const DEFAULT_URL = 'ws://localhost:5050/files' as t.StringUrl;
const DEFAULT_PATH = 'shell.yaml' as t.Files.String.Path;
const TIMEOUT = 3_000;

/** Probe the local Files-over-WebSocket service used by the AppShell UI harness. */
export async function probeFilesWebSocket(
  options: { readonly url?: t.StringUrl | URL; readonly path?: t.Files.String.Path } = {},
) {
  const url = options.url ?? DEFAULT_URL;
  const path = options.path ?? DEFAULT_PATH;
  let client: t.Files.Client.WebSocket | undefined;

  try {
    client = await Files.Client.websocket(url, { timeout: TIMEOUT });

    // Edge learned: only readText has a high-level Files.Client method today.
    // Keep capability/list/manifest probing on the typed Cmd escape hatch until the API is designed.
    const capabilities = await client.cmd.send(Files.Cmd.Name.capabilities, {});
    const list = await client.cmd.send(Files.Cmd.Name.list, {});
    const manifest = await client.cmd.send(Files.Cmd.Name.manifest, { content: true });
    const text = await client.readText(path);
    const result = { url: String(url), path, capabilities, list, manifest, text };

    console.groupCollapsed('files:websocket probe');
    console.info('url', result.url);
    console.info('capabilities', capabilities);
    console.info('list', list);
    console.info('manifest', manifest);
    console.info('file', { path, text });
    console.groupEnd();

    return result;
  } catch (cause) {
    console.error('files:websocket probe failed', cause);
    throw cause;
  } finally {
    if (client) await client.close('files:websocket probe complete');
  }
}
