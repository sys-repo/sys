import type { readFilesSnapshot } from './u.snapshot.ts';

export function logProbe(result: Awaited<ReturnType<typeof readFilesSnapshot>>) {
  console.groupCollapsed('files:websocket probe');
  console.info('url', result.url);
  console.info('capabilities', result.capabilities);
  console.info('list', result.list);
  console.info('manifest', result.manifest);
  console.info('file', { path: result.path, text: result.text });
  console.groupEnd();
}

export function logProbeFailed(cause: unknown) {
  console.error('files:websocket probe failed', cause);
}

export function logWatchStarted(args: { readonly url: string; readonly id: string }) {
  console.info('files:websocket watch started', args);
}

export function logWatchEvent(event: unknown) {
  console.info('files:websocket watch', event);
}

export function logWatchDone(result: unknown) {
  console.info('files:websocket watch done', result);
}

export function logWatchClosed(cause: unknown) {
  console.info('files:websocket watch closed', cause);
}
