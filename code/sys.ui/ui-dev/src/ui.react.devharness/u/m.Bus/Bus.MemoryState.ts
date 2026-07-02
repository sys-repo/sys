import { DEFAULTS, Id, Is, Obj, RxBus, type t } from './common.ts';

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
  _current.instance.bus = RxBus.instance(args.instance.bus);

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
      const clone = Obj.clone(_current); // TEMP | SLOW (potentially too slow)  🐷

      if (typeof change === 'function') {
        const res = change(clone);
        if (Is.promise(res)) await res;
      }

      // NB: Merging here is a "poor man's CRDT" strategy (use Automerge or JsonPatch plugin).
      const changedByAnotherProcess = before.number !== _revision.number;
      _current = changedByAnotherProcess ? mergeDeepRight(_current, clone) : clone;
      _revision = { number: before.number + 1, message };

      args.onChanged?.({ message, info: _current });
    },
  };

  return api;
}

function mergeDeepRight<L extends object, R extends object>(left: L, right: R): L & R {
  return mergeDeep(left, right, new WeakMap()) as L & R;
}

function mergeDeep(left: unknown, right: unknown, seen: WeakMap<object, unknown>): unknown {
  if (!isPlainMergeRecord(left) || !isPlainMergeRecord(right)) return cloneMergeValue(right, seen);

  const res = clonePlainMergeRecord(left, seen);
  for (const key of Reflect.ownKeys(right)) {
    const leftValue = res[key];
    const rightValue = (right as Record<PropertyKey, unknown>)[key];
    res[key] = isPlainMergeRecord(leftValue) && isPlainMergeRecord(rightValue)
      ? mergeDeep(leftValue, rightValue, seen)
      : cloneMergeValue(rightValue, seen);
  }
  return res;
}

function cloneMergeValue(value: unknown, seen: WeakMap<object, unknown>): unknown {
  if (!isPlainMergeRecord(value)) return Obj.clone(value);
  return clonePlainMergeRecord(value, seen);
}

function clonePlainMergeRecord(
  value: Record<PropertyKey, unknown>,
  seen: WeakMap<object, unknown>,
): Record<PropertyKey, unknown> {
  if (seen.has(value)) return seen.get(value) as Record<PropertyKey, unknown>;

  const res: Record<PropertyKey, unknown> = Object.create(Object.getPrototypeOf(value));
  seen.set(value, res);
  for (const key of Reflect.ownKeys(value)) {
    res[key] = cloneMergeValue(value[key], seen);
  }
  return res;
}

function isPlainMergeRecord(value: unknown): value is Record<PropertyKey, unknown> {
  if (value === null || typeof value !== 'object') return false;
  if (Array.isArray(value)) return false;
  if (value instanceof Date || value instanceof RegExp) return false;
  if (value instanceof Map || value instanceof Set) return false;
  if (ArrayBuffer.isView(value) || value instanceof ArrayBuffer) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
