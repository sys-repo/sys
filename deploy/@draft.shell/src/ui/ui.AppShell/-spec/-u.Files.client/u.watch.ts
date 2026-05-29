import { Files, type t } from './common.ts';
import { logWatchClosed, logWatchDone, logWatchEvent, logWatchStarted } from './u.log.ts';

let activeWatch: { dispose(): void } | undefined;

/** Dispose the sample watch between probe button clicks. */
export function disposeActiveFilesWatch() {
  activeWatch?.dispose();
  activeWatch = undefined;
}

/** Subscribe to future changes from the sample file service. */
export async function startFilesWatch(url: t.StringUrl | URL) {
  disposeActiveFilesWatch();
  const client = await Files.Client.websocket(url);
  const stream = client.watch();
  stream.onEvent(logWatchEvent);
  let disposed = false;

  logWatchStarted({ url: String(url), id: stream.id });
  void stream.done.then(logWatchDone, logWatchClosed).finally(async () => {
    if (!client.disposed) await client.close('files:websocket watch done');
    if (activeWatch?.dispose === dispose) activeWatch = undefined;
  });

  function dispose() {
    if (disposed) return;
    disposed = true;
    stream.dispose();
    void client.close('files:websocket watch dispose');
  }

  activeWatch = { dispose };
  return activeWatch;
}
