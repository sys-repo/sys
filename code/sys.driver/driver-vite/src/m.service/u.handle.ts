import { Err, Rx, type t } from './common.ts';

/** Wrap the running Vite process in a renderer-neutral service handle. */
export function handleOf(
  location: t.ViteService.Location,
  server: t.Vite.Dev.Process,
): t.ViteService.DevHandle {
  const runtime: RuntimeState = { state: 'ready' };
  const finished = finishedOf(server, runtime);

  const close = async (reason?: unknown) => {
    if (!server.disposed) runtime.state = 'stopping';
    await server.dispose(reason);
  };

  return {
    location,
    cwd: location.dir,
    config: location.config,
    server,
    port: server.port,
    url: server.url,
    finished,
    close,
    dispose: close,
    status() {
      return statusOf(location, server, runtime);
    },
  };
}

/**
 * Helpers:
 */
type RuntimeState = {
  state: t.Service.State;
  error?: t.StdError;
};

function finishedOf(server: t.Vite.Dev.Process, runtime: RuntimeState): Promise<void> {
  if (server.disposed) return Promise.resolve();

  return Rx.firstValueFrom(
    server.dispose$.pipe(
      Rx.filter((e) => e.payload.is.done),
      Rx.take(1),
    ),
  ).then((event) => {
    if (event.payload.stage === 'error') {
      runtime.state = 'error';
      runtime.error = event.payload.error?.cause ??
        Err.std(event.payload.error?.message ?? 'Dispose error');
      return;
    }
    runtime.state = 'stopped';
  });
}

function statusOf(
  location: t.ViteService.Location,
  server: t.Vite.Dev.Process,
  runtime: RuntimeState,
): t.Service.Status {
  return {
    state: server.disposed && runtime.state !== 'error' ? 'stopped' : runtime.state,
    ...(location.name ? { name: location.name } : {}),
    kind: 'vite:dev',
    root: location.dir,
    config: location.config,
    urls: [{ href: server.url, label: 'local' }],
    details: [{ label: 'port', value: String(server.port) }],
    ...(runtime.error ? { error: runtime.error } : {}),
  };
}
