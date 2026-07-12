import { Obj, type t } from '../common.ts';
import { move, movePart } from './u.move.ts';
import { eql, findItem, target, toScope } from './u.resolve.ts';

/** Pure cursor helpers for command-addressable KeyValue item projections. */
export const Cursor: t.KeyValue.Cursor.Lib = {
  target,
  eql,

  scope(items, path = []) {
    return toScope(items, path);
  },

  set(model, items, nextTarget) {
    if (!nextTarget) return {};
    return findItem(items, nextTarget) ? { ...model, current: Cursor.target(nextTarget.path, nextTarget.part) } : model;
  },

  next(model, items) {
    return move(model, items, 1);
  },

  previous(model, items) {
    return move(model, items, -1);
  },

  left(model, items) {
    return movePart(model, items, -1);
  },

  right(model, items) {
    return movePart(model, items, 1);
  },

  enter(model, items) {
    const current = model.current;
    if (!current) return model;

    const item = findItem(items, current);
    if (!item?.enterable) return model;

    const scope = Cursor.scope(items, current.path);
    const next = scope.items[0];
    return next ? { ...model, current: Cursor.target(next.target.path) } : model;
  },

  exit(model) {
    const current = model.current;
    if (!current) return model;
    if (current.part) return { ...model, current: Cursor.target(current.path) };
    if (current.path.length <= 1) return {};

    const parent = Obj.Path.slice(current.path, 0, -1);
    return { ...model, current: Cursor.target(parent) };
  },

  apply(model, items, command) {
    if (command.name === 'cursor:set') return Cursor.set(model, items, command.payload.target);
    if (command.name === 'cursor:next') return Cursor.next(model, items);
    if (command.name === 'cursor:previous') return Cursor.previous(model, items);
    if (command.name === 'cursor:left') return Cursor.left(model, items);
    if (command.name === 'cursor:right') return Cursor.right(model, items);
    if (command.name === 'cursor:enter') return Cursor.enter(model, items);
    if (command.name === 'cursor:exit') return Cursor.exit(model);
    return model;
  },
};
