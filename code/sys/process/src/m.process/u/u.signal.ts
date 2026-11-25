import { Is, type t } from '../common.ts';

type Listener = (name: t.Process.Signal.Name, handler: () => void) => void;
type Provider = { addSignalListener?: Listener; removeSignalListener?: Listener };

/** Internal provider seam for current-process signal subscriptions. */
export function createSignalOn(
  read: () => Provider | undefined,
): t.Process.Signal.Lib['on'] {
  return (name, handler) => {
    const provider = read();
    const add = provider?.addSignalListener;
    const remove = provider?.removeSignalListener;
    if (!provider || !Is.func(add) || !Is.func(remove)) return { kind: 'unsupported' };

    // Native registration may deduplicate callbacks by identity.
    const listener = () => handler();
    add.call(provider, name, listener);
    let disposed = false;
    return {
      kind: 'attached',
      dispose() {
        if (disposed) return;
        remove.call(provider, name, listener);
        disposed = true;
      },
    };
  };
}

/**
 * Subscribe to an OS signal delivered to the current process.
 */
export const signalOn = createSignalOn(() => globalThis.Deno);
