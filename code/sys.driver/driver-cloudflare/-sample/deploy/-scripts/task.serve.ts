import { Fs, ROOT } from './common.ts';
import { SampleService } from './service.ts';
import { runTask } from './u.task.ts';

/**
 * Start the local server after verifying the private manifest.
 */
Deno.exitCode = await runTask('serve', async () => {
  const stopping = new AbortController();
  await using server = await SampleService.start({
    cwd: ROOT,
    paths: { config: Fs.join(ROOT, 'r2.config.json') },
    until: stopping.signal,
  });

  const stop = () => stopping.abort('SIGINT');
  try {
    Deno.addSignalListener('SIGINT', stop);
    await server.finished;
  } finally {
    Deno.removeSignalListener('SIGINT', stop);
  }
});
