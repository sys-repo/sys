import { isObject, type t } from './common.ts';

/**
 * Flags: Event pattern inference.
 */
export const Is: t.CmdIsLib = {
  state: {
    cmd(input: any): input is t.CmdPathsObject {
      if (!isObject(input)) return false;
      const o = input as t.CmdPathsObject;
      const q = o.queue;
      if (!Array.isArray(q)) return false;
      if (!Is.state.log(o.log)) return false;
      if (q.length > 0 && !Is.state.item(q[q.length - 1])) return false;
      return true;
    },

    item(input: any): input is t.CmdQueueItem<t.CmdType> {
      if (!isObject(input)) return false;
      const o = input as t.CmdQueueItem<t.CmdType>;
      return (
        typeof o.name === 'string' &&
        typeof o.params === 'object' &&
        typeof o.tx === 'string' &&
        typeof o.id === 'string'
      );
    },

    log(input: any): input is t.CmdLog {
      if (!isObject(input)) return false;
      const o = input as t.CmdLog;
      return typeof o.total?.purged === 'number';
    },
  },

  cmd<C extends t.CmdType>(input: t.Cmd<C> | any): input is t.Cmd<C> {
    if (!isObject(input)) return false;
    const o = input as t.Cmd<C>;
    return (
      typeof o.events === 'function' &&
      typeof o.invoke === 'function' &&
      typeof o.method === 'function'
    );
  },
} as const;
