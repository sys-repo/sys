import { type t } from '../../common.ts';
import { move, moveBlock, moveEdge, movePart } from '../u/u.move.ts';
import { eql, target, toScope } from '../u/u.resolve.ts';
import { enterTarget, exitTarget, setTarget } from './m.Cursor.u.ts';
import { useKeyboardEntry } from '../u/use.KeyboardEntry.ts';

/** KeyValue cursor model helpers and host-owned adapters. */
export const Cursor: t.KeyValue.Cursor.Lib = {
  useKeyboardEntry,

  target,
  eql,

  scope(items, path = []) {
    return toScope(items, path);
  },

  set(model, items, nextTarget) {
    return Cursor.cmd(model, items, { name: 'cursor:set', payload: { target: nextTarget } });
  },

  next(model, items) {
    return move(model, items, 1);
  },

  previous(model, items) {
    return move(model, items, -1);
  },

  nextBlock(model, items) {
    return moveBlock(model, items, 1);
  },

  previousBlock(model, items) {
    return moveBlock(model, items, -1);
  },

  first(model, items) {
    return moveEdge(model, items, 'first');
  },

  last(model, items) {
    return moveEdge(model, items, 'last');
  },

  left(model, items) {
    return movePart(model, items, -1);
  },

  right(model, items) {
    return movePart(model, items, 1);
  },

  enter(model, items) {
    return enterTarget(model, items);
  },

  exit(model) {
    return exitTarget(model);
  },

  cmd(model, items, command) {
    if (command.name === 'cursor:set') return setTarget(model, items, command.payload.target);
    if (command.name === 'cursor:next') return Cursor.next(model, items);
    if (command.name === 'cursor:previous') return Cursor.previous(model, items);
    if (command.name === 'cursor:next-block') return Cursor.nextBlock(model, items);
    if (command.name === 'cursor:previous-block') return Cursor.previousBlock(model, items);
    if (command.name === 'cursor:first') return Cursor.first(model, items);
    if (command.name === 'cursor:last') return Cursor.last(model, items);
    if (command.name === 'cursor:left') return Cursor.left(model, items);
    if (command.name === 'cursor:right') return Cursor.right(model, items);
    if (command.name === 'cursor:enter') return Cursor.enter(model, items);
    if (command.name === 'cursor:exit') return Cursor.exit(model);
    return model;
  },
};
