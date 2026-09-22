import { HttpServer } from '@sys/http/server';
import { appFrom } from '../src/entry.ts';
import { readInputs } from '../src/m.app/u.data.ts';
import { Env, pkg, ROOT } from './common.ts';
import { buildStatus } from './u.status.ts';
import { runTask } from './u.task.ts';

/**
 * Reuse the existing repository dotenv lookup without exporting secrets into process env.
 */
Deno.exitCode = await runTask('serve', async () => {
  const inputs = await readInputs(ROOT);
  const env = await Env.load({ cwd: ROOT, search: 'upward' });
  const app = await appFrom(inputs, env);
  const build = await buildStatus(inputs.selection.private);
  const server = HttpServer.start(app, {
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

  const stop = () => void server.close();
  Deno.addSignalListener('SIGINT', stop);

  try {
    await server.finished;
  } finally {
    Deno.removeSignalListener('SIGINT', stop);
    await server.close();
  }
});
