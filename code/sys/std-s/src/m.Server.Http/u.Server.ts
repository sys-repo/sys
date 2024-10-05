import { Auth } from '../m.Server.Auth/mod.ts';
import { Hono, cors, serveStatic, type t } from './common.ts';
import { create } from './u.Server.create.ts';
import { options, print } from './u.ts';

/**
 * Server Lib.
 */
export const HttpServer: t.HttpServerLib = {
  Auth,
  Hono,
  cors,
  static: serveStatic,
  create,
  print,
  options,
} as const;
