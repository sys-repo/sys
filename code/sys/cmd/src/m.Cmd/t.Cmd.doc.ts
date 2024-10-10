import type { t } from './common.ts';

/**
 * A fully resolved document object for a <Cmd> lens.
 */
export type CmdObject<C extends t.CmdType> = {
  queue: t.CmdQueue<C>;
  total: t.CmdLog;
};

/**
 * Total meta-data about a command.
 */
export type CmdLog = {
  total: { purged: number };
};
