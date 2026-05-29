import { Files, type t } from './common.ts';

const DEFAULT_URL = 'ws://localhost:5050/files' as t.StringUrl;
const DEFAULT_PATH = 'shell.yaml' as t.Files.String.Path;
const TIMEOUT = 3_000;

let activeWatch: { dispose(): void } | undefined;

/** Probe the local Files-over-WebSocket service used by the AppShell UI harness. */
export async function probeFilesWebSocket(
  options: { readonly url?: t.StringUrl | URL; readonly path?: t.Files.String.Path } = {},
) {
  const url = options.url ?? DEFAULT_URL;
  const path = options.path ?? DEFAULT_PATH;
  let client: t.Files.Client.WebSocket | undefined;

  try {
    activeWatch?.dispose();
    client = await Files.Client.websocket(url, { timeout: TIMEOUT });

    const result = await readProbe(client, url, path);
    logProbe(result);

    if (result.capabilities.watch) activeWatch = await watchFilesWebSocket(url);
    return result;
  } catch (cause) {
    console.error('files:websocket probe failed', cause);
    throw cause;
  } finally {
    if (client) await client.close('files:websocket probe complete');
  }
}

async function readProbe(
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

function logProbe(result: Awaited<ReturnType<typeof readProbe>>) {
  console.groupCollapsed('files:websocket probe');
  console.info('url', result.url);
  console.info('capabilities', result.capabilities);
  console.info('list', result.list);
  console.info('manifest', result.manifest);
  console.info('file', { path: result.path, text: result.text });
  console.groupEnd();
}

async function watchFilesWebSocket(url: t.StringUrl | URL) {
  const client = await Files.Client.websocket(url);
  const stream = client.cmd.stream(Files.Cmd.Name.watch, {});
  const events = stream.onEvent((event) => console.info('files:websocket watch', event));
  let disposed = false;

  console.info('files:websocket watch started', { url: String(url), id: stream.id });
  void stream.done.then(
    (result) => console.info('files:websocket watch done', result),
    (cause) => console.info('files:websocket watch closed', cause),
  ).finally(async () => {
    events.dispose();
    if (!client.disposed) await client.close('files:websocket watch done');
    if (activeWatch?.dispose === dispose) activeWatch = undefined;
  });

  function dispose() {
    if (disposed) return;
    disposed = true;
    events.dispose();
    stream.dispose();
    void client.close('files:websocket watch dispose');
  }

  return { dispose };
}
