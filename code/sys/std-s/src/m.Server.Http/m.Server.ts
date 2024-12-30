import { Hono, cors, type t } from './common.ts';
import { create } from './u.create.ts';
import { serveStatic } from './u.serveStatic.ts';
import { options, print } from './u.ts';
import { keyboard } from './u.keyboard.ts';

/**
 * HTTP Server.
 */
export const HttpServer: t.HttpServerLib = {
  Hono,
  cors,
  static: serveStatic,
  create,
  print,
  options,
  keyboard,
} as const;
