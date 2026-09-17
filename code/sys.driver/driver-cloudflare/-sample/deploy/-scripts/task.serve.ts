import { HttpServer } from '@sys/http/server';
import { main } from '../src/entry.ts';
import { Env, pkg, ROOT } from './common.ts';
import { buildStatus } from './u.status.ts';

/**
 * Reuse the existing repository dotenv lookup without exporting secrets into process env.
 */
const env = await Env.load({ cwd: ROOT, search: 'upward' });
const app = await main({ targetDir: '.' }, env);
const build = await buildStatus();
const server = HttpServer.start(app, {
  name: pkg.name,
  hostname: '127.0.0.1',
  port: 8080,
  strictPort: true,
  keyboard: false,
  formatDetail: build.formatDetail,
  status: {
    details: [build.detail],
    urlPaths: ['/', '/ui/', '/api/hello', '/ui/dist.json'],
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
