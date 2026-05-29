import { Files, type t } from './common.ts';
import { DEFAULT_PATH, DEFAULT_URL, TIMEOUT } from './u.constants.ts';
import { logProbe, logProbeFailed } from './u.log.ts';
import { readFilesSnapshot } from './u.snapshot.ts';
import { disposeActiveFilesWatch, startFilesWatch } from './u.watch.ts';

/** Probe the local Files-over-WebSocket service used by the AppShell UI harness. */
export async function probeFilesWebSocket(
  options: { readonly url?: t.StringUrl | URL; readonly path?: t.Files.String.Path } = {},
) {
  const url = options.url ?? DEFAULT_URL;
  const path = options.path ?? DEFAULT_PATH;
  let client: t.Files.Client.WebSocket | undefined;

  try {
    disposeActiveFilesWatch();
    client = await Files.Client.websocket(url, { timeout: TIMEOUT });

    const result = await readFilesSnapshot(client, url, path);
    logProbe(result);

    if (result.capabilities.watch) await startFilesWatch(url);
    return result;
  } catch (cause) {
    logProbeFailed(cause);
    throw cause;
  } finally {
    if (client) await client.close('files:websocket probe complete');
  }
}
