import type { t } from './common.ts';

export type * from './t.Cmd.ts';
export type * from './t.Cmd.doc.ts';
export type * from './t.Cmd.doc.path.ts';
export type * from './t.Cmd.events.ts';
export type * from './t.Cmd.immutable.ts';
export type * from './t.Cmd.method.ts';
export type * from './t.Cmd.queue.ts';
export type * from './t.Cmd.req.ts';
export type * from './t.Cmd.res.ts';
export type * from './t.Cmd.test.ts';
export type * from './t.Cmd.type.ts';

/**
 * Command type checks.
 */
export type CmdIsLib = {
  /** Determine if the input is a Cmd<T>. */
  cmd<C extends t.CmdType>(input: t.Cmd<C> | any): input is t.Cmd<C>;
  readonly state: {
    /** Determine if the input is a Cmd paths object. */
    cmd(input: unknown): input is t.CmdPathsObject;

    /** Determine if the input is a queue item. */
    item(input: unknown): input is t.CmdQueueItem<t.CmdType>;

    /** Determine if the input is a log. */
    log(input: unknown): input is t.CmdLog;
  };
};
