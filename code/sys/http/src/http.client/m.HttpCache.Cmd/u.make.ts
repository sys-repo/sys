import { Cmd } from '@sys/event/cmd';
import { type t, D } from './common.ts';

/**
 * Create a typed command factory for HTTP cache commands.
 */
export const make: t.HttpCacheCmdLib['make'] = (args = {}) => {
  const ns = args.ns ?? D.NS;
  return Cmd.make<
    t.HttpCacheCmdName,
    t.HttpCacheCmdPayloadMap,
    t.HttpCacheCmdResultMap,
    t.HttpCacheCmdEventMap
  >({ ns });
};
