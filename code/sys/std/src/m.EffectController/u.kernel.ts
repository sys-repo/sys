import { type t, Rx, slug } from './common.ts';
import { defaultIsNoop } from './u.noop.ts';

/**
 * Create an EffectController kernel.
 */
export function create<State, Patch = Partial<State>>(
  args: t.EffectControllerCreateArgs<State, Patch>,
): t.EffectController<State, Patch> {
  const { ref, applyPatch = defaultApplyPatch, isNoop = defaultIsNoop } = args;
  const id = args.id ?? `EffectController-${slug()}`;
  const life = Rx.lifecycle();
  const listeners = new Set<t.EffectControllerChangeHandler<State>>();

  let _rev = 0;

  // Subscribe to ref changes.
  const events = ref.events(life.dispose$);
  events.$.subscribe(({ after }) => {
    _rev += 1;
    listeners.forEach((fn) => fn(after));
  });

  const controller = Rx.toLifecycle<t.EffectController<State, Patch>>(life, {
    id,
    get rev() {
      return _rev;
    },

    current() {
      return ref.current;
    },

    next(patch?: Patch) {
      if (life.disposed) return;
      if (isNoop(ref.current, patch)) return;
      const p = patch as Patch;
      ref.change((d) => applyPatch(d, p));
    },

    onChange(fn) {
      if (life.disposed) return () => {};
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  });

  life.dispose$.subscribe(() => listeners.clear());

  return controller;
}

/**
 * Default patch application for Partial<State> object patches.
 */
function defaultApplyPatch<State, Patch>(draft: State, patch: Patch): void {
  Object.assign(draft as object, patch as object);
}
