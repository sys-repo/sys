import { type t, D } from './common.ts';
import { Handlers } from './u.handlers.ts';
import { listen } from './u.listen.ts';
import { make } from './u.make.ts';

/**
 * HTTP cache command namespace.
 *
 * Exposes stable command identifiers and a typed `Cmd.make` wrapper for the
 * `http.cache.clear` / `http.cache.info` command set. This module is intentionally side-effect
 * free and does not perform cache operations directly.
 */
export const CacheCmd: t.HttpCacheCmdLib = {
  NS: D.NS,
  CONNECT: D.CONNECT,
  CLEAR: D.CLEAR,
  INFO: D.INFO,
  Handlers,
  make,
  listen,
};
