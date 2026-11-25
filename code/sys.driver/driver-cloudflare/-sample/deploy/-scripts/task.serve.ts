import { Process } from '@sys/process';
import { Fs, ROOT, type t } from './common.ts';
import { SampleService } from './service.ts';
import { runTask } from './u.task.ts';

type OwnedServer = AsyncDisposable & Pick<t.HttpServer.Started, 'finished'>;

/** Own the local server until it finishes, with a required interrupt subscription. */
export async function serveWith(
  start: (until: AbortSignal) => Promise<OwnedServer>,
  onSignal: typeof Process.Signal.on,
) {
  const stopping = new AbortController();
  await using server = await start(stopping.signal);
  const subscription = onSignal('SIGINT', () => stopping.abort('SIGINT'));
  if (subscription.kind === 'unsupported') {
    throw new Error('Sample serve requires a SIGINT subscription.');
  }

  try {
    await server.finished;
  } finally {
    subscription.dispose();
  }
}

function startSample(until: AbortSignal) {
  const config = Fs.join(ROOT, 'r2.config.json');
  return SampleService.start({ cwd: ROOT, paths: { config }, until });
}

if (import.meta.main) {
  const serve = () => serveWith(startSample, Process.Signal.on);
  const exitCode = await runTask('serve', serve);
  Deno.exitCode = exitCode;
}
