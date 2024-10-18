import { DEFAULTS, Id, Is, R, rx, type t } from './common.ts';

type Revision = { number: number; message: string };

export type ChangedHandler = (e: ChangedHandlerArgs) => void;
export type ChangedHandlerArgs = { message: t.DevInfoChangeMessage; info: t.DevInfo };

/**
 * Helper/wrapper for managing an in-memory version of the root state tree.
 */
export function BusMemoryState(args: {
  instance: t.DevInstance;
  onChanged?: ChangedHandler;
  env?: t.DevEnvVars;
}) {
  const { env } = args;
  let _revision: Revision = { number: 0, message: 'initial' };
  let _current: t.DevInfo = { ...DEFAULTS.info, env };

  _current.instance.session = Id.ctx.create();
  _current.instance.bus = rx.bus.instance(args.instance.bus);

  /**
   * API
   */
  const api = {
    get revision() {
      return { ..._revision };
    },
    get current(): t.DevInfo {
      return { ..._current };
    },
    async change(message: t.DevInfoChangeMessage, change: t.DevInfoMutater | t.DevInfo) {
      /**
       * TODO 🐷
       *   Do this with either
       *    - [JsonPatch] or
       *    - [Automerge]....etc.
       *
       *   Make these options available as an injected plugin (IoC).
       */
      const before = api.revision;
      const clone = R.clone(_current); // TEMP | SLOW (potentially too slow)  🐷

      if (typeof change === 'function') {
        const res = change(clone);
        if (Is.promise(res)) await res;
      }

      // NB: Merging here is a "poor man's CRDT" strategy (use Automerge or JsonPatch plugin).
      const changedByAnotherProcess = before.number !== _revision.number;
      _current = changedByAnotherProcess ? (R.mergeDeepRight(_current, clone) as t.DevInfo) : clone;
      _revision = { number: before.number + 1, message };

      args.onChanged?.({ message, info: _current });
    },
  };

  return api;
}
