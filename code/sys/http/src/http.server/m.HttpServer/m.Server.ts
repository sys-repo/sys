import { cors, Hono, type t } from './common.ts';
import { create } from './m.Server.create.ts';
import { keyboard } from './u/u.keyboard.ts';
import { forceDirSlash } from './u/u.middleware.ts';
import { options } from './u/u.options.ts';
import { print } from './u/u.print.ts';
import { serveStatic } from './u/u.serveStatic.ts';
import { start } from './u/u.start.ts';

/**
 * HTTP Server.
 */
export const HttpServer: t.HttpServer.Lib = Object.freeze({
  Hono,
  cors,
  static: serveStatic,
  forceDirSlash,
  create,
  start,
  print,
  options,
  keyboard,
});
