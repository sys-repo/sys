import type { HttpServerLib } from './t.ts';

import { Hono, cors } from './common.ts';
import { create } from './m.Server.create.ts';
import { keyboard } from './u.keyboard.ts';
import { forceDirSlash } from './u.middleware.ts';
import { options } from './u.options.ts';
import { print } from './u.print.ts';
import { serveStatic } from './u.serveStatic.ts';

/**
 * HTTP Server.
 */
export const HttpServer: HttpServerLib = {
  Hono,
  cors,
  static: serveStatic,
  forceDirSlash,
  create,
  print,
  options,
  keyboard,
} as const;
