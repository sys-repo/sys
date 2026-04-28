import type { HttpServerLib } from './t.ts';

import { cors, Hono } from './common.ts';
import { create } from './m.Server.create.ts';
import { forceDirSlash } from './u.middleware.ts';
import { options } from './u.options.ts';
import { print } from './u.print.ts';
import { serveStatic } from './u.serveStatic.ts';
import { start } from './u.start.ts';

/**
 * HTTP Server.
 */
export const HttpServer: HttpServerLib = {
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
