import { Cmd } from '@sys/event/cmd';
import { type t, D } from './common.ts';

/**
 * Create a typed command factory for HTTP cache commands.
 */
export const make: t.HttpCacheCmd.Lib['make'] = (args = {}) => {
  const ns = args.ns ?? D.NS;
  return Cmd.make<
    t.HttpCacheCmd.Name,
    t.HttpCacheCmd.PayloadMap,
    t.HttpCacheCmd.ResultMap,
    t.HttpCacheCmd.EventMap
  >({ ns });
};
