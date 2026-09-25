import { Is, Num, Obj, type t } from './common.ts';

// Registration depends on identity, not an object's mutable properties or prototype.
const exposed = new WeakMap<object, t.Cmd.Error.Detail>();

/**
 * Explicit approval of immutable diagnostic snapshots for command transport.
 */
export const CmdError: t.Cmd.Error.Lib = Object.freeze({
  expose(input) {
    const detail = snapshotErrorDetail(input);
    if (!detail) throw new TypeError('Invalid public command error detail.');
    const error = new Error(detail.message, { cause: detail });
    error.name = detail.name;
    exposed.set(error, detail);
    return error;
  },
});

/** Host-only lookup; never recursively serialize an arbitrary cause chain. */
export function exposedError(error: unknown): t.Cmd.Error.Detail | undefined {
  return Is.object(error) ? exposed.get(error) : undefined;
}

/** Copy only admitted fields; malformed optional wire detail cannot hide the legacy failure. */
export function snapshotErrorDetail(input: unknown): t.Cmd.Error.Detail | undefined {
  try {
    if (!Is.plainObject(input)) return;
    const { name, message, data } = input;
    if (!Is.str(name) || !name || !Is.str(message)) return;
    if (data === undefined) return Object.freeze({ name, message });
    if (!Is.plainObject(data)) return;
    const entries: [string, string | number | boolean][] = [];
    for (const [key, value] of Obj.entries(data)) {
      if (!Is.str(key)) return;
      if (!Is.str(value) && !Is.bool(value) && !Num.Is.finite(value)) return;
      entries.push([key, value]);
    }
    const snapshot = Object.freeze(Object.fromEntries(entries));
    return Object.freeze({ name, message, data: snapshot });
  } catch {
    return;
  }
}
