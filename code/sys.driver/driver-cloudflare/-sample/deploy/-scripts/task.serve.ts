import { HttpServer } from '@sys/http/server';
import { appFrom, readInputs } from '../src/m.deployment/mod.ts';
import { Env, pkg, ROOT } from './common.ts';
import { buildStatus } from './u.status.ts';
import { runTask } from './u.task.ts';

/**
 * Start the local server after verifying the private manifest.
 */
Deno.exitCode = await runTask('serve', async () => {
  const inputs = await readInputs(ROOT);
  const env = await Env.load({ cwd: ROOT, search: 'upward' });
  const app = await appFrom(inputs, env);
  const build = await buildStatus(inputs.buildRecord.selection.pins.private);
  const stopping = new AbortController();
  await using server = HttpServer.start(app, {
    until: stopping.signal,
    name: pkg.name,
    hostname: '127.0.0.1',
    port: 8080,
    strictPort: true,
    keyboard: false,
    formatDetail: build.formatDetail,
    status: {
      details: [build.detail],
      urlPaths: ['/', '/ui/', '/ui/dist.json', '/api/hello'],
    },
  });

  const stop = () => stopping.abort('SIGINT');
  try {
    Deno.addSignalListener('SIGINT', stop);
    await server.finished;
  } finally {
    Deno.removeSignalListener('SIGINT', stop);
  }
});
