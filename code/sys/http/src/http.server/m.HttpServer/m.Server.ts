import { cors, Hono, type t } from './common.ts';
import { create } from './m.Server.create.ts';
import { forceDirSlash } from './u/u.middleware.ts';
import { options } from './u/u.options.ts';
import { print } from './u/u.print.ts';
import { serveStatic } from './u/u.serveStatic.ts';
import { start } from './u/u.start.ts';

/**
 * HTTP Server.
 */
export const HttpServer: t.HttpServer.Lib = {
  Hono,
  cors,
  static: serveStatic,
  forceDirSlash,
  create,
  start,
  print,
  options,
  async keyboard(args) {
    const { keyboard } = await import('./u.keyboard.ts');
    return await keyboard(args);
  },
} as const;
