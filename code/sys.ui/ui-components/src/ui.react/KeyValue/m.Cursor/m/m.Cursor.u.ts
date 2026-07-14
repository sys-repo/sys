import { Obj, type t } from '../../common.ts';
import { findItem, target, toScope } from '../u/u.resolve.ts';

export function setTarget(
  model: t.KeyValue.Cursor.Model,
  items: readonly t.KeyValue.Item[],
  nextTarget?: t.KeyValue.Cursor.Target,
) {
  if (!nextTarget) return {};
  return findItem(items, nextTarget)
    ? { ...model, current: target(nextTarget.path, nextTarget.part) }
    : model;
}

export function enterTarget(model: t.KeyValue.Cursor.Model, items: readonly t.KeyValue.Item[]) {
  const current = model.current;
  if (!current) return model;

  const item = findItem(items, current);
  if (!item?.enterable) return model;

  const scope = toScope(items, current.path);
  const next = scope.items[0];
  return next ? { ...model, current: target(next.target.path) } : model;
}

export function exitTarget(model: t.KeyValue.Cursor.Model) {
  const current = model.current;
  if (!current) return model;
  if (current.part) return { ...model, current: target(current.path) };
  if (current.path.length <= 1) return {};

  const parent = Obj.Path.slice(current.path, 0, -1);
  return { ...model, current: target(parent) };
}
