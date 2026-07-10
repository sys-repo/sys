import { Obj, type t } from '../common.ts';
import { eql, target, toScope } from './u.resolve.ts';

export function move(model: t.KeyValue.Cursor.Model, items: readonly t.KeyValue.Item[], delta: 1 | -1) {
  const current = model.current;
  const scopePath = current ? Obj.Path.slice(current.path, 0, -1) : [];
  const scope = toScope(items, scopePath);
  if (scope.items.length === 0) return model;

  if (!current) {
    const next = scope.items[delta > 0 ? 0 : scope.items.length - 1];
    return { ...model, current: target(next.target.path) };
  }

  const index = scope.items.findIndex((item) => eql(item.target, current));
  if (index < 0) return { ...model, current: target(scope.items[0].target.path) };

  const nextIndex = Math.max(0, Math.min(scope.items.length - 1, index + delta));
  return { ...model, current: target(scope.items[nextIndex].target.path) };
}
