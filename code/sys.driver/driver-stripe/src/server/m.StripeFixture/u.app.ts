import { HttpServer, type t } from '../common.ts';
import { pkg } from '../../pkg.ts';
import { createSession } from './u.session.ts';
import { methodNotAllowed, path } from './u.route.ts';

export function createApp(args: { readonly cwd: t.StringDir }) {
  const app = HttpServer.create({ pkg, static: false });
  app.post(path, async () => await createSession({ cwd: args.cwd }));
  app.all(path, () => methodNotAllowed('POST'));
  app.get('/favicon.ico', () => new Response(null, { status: 204 }));
  app.get('/', () =>
    Response.json({
      name: pkg.name,
      fixture: 'stripe-runtime',
      endpoint: path,
    }));
  return app;
}
