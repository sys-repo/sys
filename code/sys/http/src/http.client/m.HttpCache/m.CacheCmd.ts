import { type t } from './common.ts';
import { Cmd } from '@sys/event/cmd';

/**
 * HTTP cache command namespace.
 *
 * Exposes stable command identifiers and a typed `Cmd.make` wrapper for the
 * `http.cache.clear` command set. This module is intentionally side-effect
 * free and does not perform cache operations directly.
 */
export const CacheCmd: t.HttpCacheCmdLib = {
  NS: 'http.cache',
  CLEAR: 'http.cache.clear',
  make(args = {}) {
    const ns = args.ns ?? CacheCmd.NS;
    return Cmd.make<
      t.HttpCacheCmdName,
      t.HttpCacheCmdPayloadMap,
      t.HttpCacheCmdResultMap,
      t.HttpCacheCmdEventMap
    >({ ns });
  },
};
