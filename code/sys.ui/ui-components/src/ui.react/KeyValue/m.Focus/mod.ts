import { Obj, type t } from '../common.ts';
import { move } from './u.move.ts';
import { eql, findItem, ref, toScope } from './u.resolve.ts';

/** Pure focus helpers for command-addressable KeyValue item projections. */
export const Focus: t.KeyValue.Focus.Lib = {
  ref,
  eql,

  scope(items, path = []) {
    return toScope(items, path);
  },

  set(model, items, target) {
    if (!target) return {};
    return findItem(items, target) ? { ...model, active: Focus.ref(target.path) } : model;
  },

  next(model, items) {
    return move(model, items, 1);
  },

  previous(model, items) {
    return move(model, items, -1);
  },

  enter(model, items) {
    const active = model.active;
    if (!active) return model;

    const current = findItem(items, active);
    if (!current?.enterable) return model;

    const scope = Focus.scope(items, active.path);
    const next = scope.items[0];
    return next ? { ...model, active: Focus.ref(next.ref.path) } : model;
  },

  exit(model) {
    const active = model.active;
    if (!active) return model;
    if (active.path.length <= 1) return {};

    const parent = Obj.Path.slice(active.path, 0, -1);
    return { ...model, active: Focus.ref(parent) };
  },

  apply(model, items, command) {
    if (command.name === 'focus:set') return Focus.set(model, items, command.payload.ref);
    if (command.name === 'focus:next') return Focus.next(model, items);
    if (command.name === 'focus:previous') return Focus.previous(model, items);
    if (command.name === 'focus:enter') return Focus.enter(model, items);
    if (command.name === 'focus:exit') return Focus.exit(model);
    return model;
  },
};
