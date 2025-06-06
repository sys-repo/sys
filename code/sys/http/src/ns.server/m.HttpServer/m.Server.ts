import type { HttpServerLib } from './t.ts';

import { Hono, cors } from './common.ts';
import { create } from './m.Server.create.ts';
import { keyboard } from './u.keyboard.ts';
import { serveStatic } from './u.serveStatic.ts';
import { options, print } from './u.ts';

/**
 * HTTP Server.
 */
export const HttpServer: HttpServerLib = {
  Hono,
  cors,
  static: serveStatic,
  create,
  print,
  options,
  keyboard,
} as const;
