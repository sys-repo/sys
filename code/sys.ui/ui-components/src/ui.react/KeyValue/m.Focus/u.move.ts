import { Obj, type t } from '../common.ts';
import { eql, ref, toScope } from './u.resolve.ts';

export function move(model: t.KeyValue.Focus.Model, items: readonly t.KeyValue.Item[], delta: 1 | -1) {
  const active = model.active;
  const scopePath = active ? Obj.Path.slice(active.path, 0, -1) : [];
  const scope = toScope(items, scopePath);
  if (scope.items.length === 0) return model;

  if (!active) {
    const next = scope.items[delta > 0 ? 0 : scope.items.length - 1];
    return { ...model, active: ref(next.ref.path) };
  }

  const index = scope.items.findIndex((item) => eql(item.ref, active));
  if (index < 0) return { ...model, active: ref(scope.items[0].ref.path) };

  const nextIndex = Math.max(0, Math.min(scope.items.length - 1, index + delta));
  return { ...model, active: ref(scope.items[nextIndex].ref.path) };
}
