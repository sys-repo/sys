import { Obj, type t } from '../../common.ts';
import { eqlPath, supportsPart, target, toScope } from './u.resolve.ts';

export function move(
  model: t.KeyValue.Cursor.Model,
  items: readonly t.KeyValue.Item[],
  delta: 1 | -1,
) {
  const current = model.current;
  const scopePath = current ? Obj.Path.slice(current.path, 0, -1) : [];
  const scope = toScope(items, scopePath);
  if (scope.items.length === 0) return model;

  if (!current) {
    const next = scope.items[delta > 0 ? 0 : scope.items.length - 1];
    return { ...model, current: target(next.target.path) };
  }

  const index = scope.items.findIndex((item) => eqlPath(item.target, current));
  if (index < 0) return { ...model, current: target(scope.items[0].target.path) };

  const item = scope.items[index];
  const nextIndex = Math.max(0, Math.min(scope.items.length - 1, index + delta));
  const next = scope.items[nextIndex];
  const currentPart = supportsPart(item, current.part) ? current.part : undefined;
  const part = supportsPart(next, currentPart) ? currentPart : undefined;
  return { ...model, current: target(next.target.path, part) };
}

export function movePart(
  model: t.KeyValue.Cursor.Model,
  items: readonly t.KeyValue.Item[],
  delta: 1 | -1,
) {
  const current = model.current;
  if (!current) return model;

  const scopePath = Obj.Path.slice(current.path, 0, -1);
  const scope = toScope(items, scopePath);
  const item = scope.items.find((item) => eqlPath(item.target, current));
  if (!item || item.parts.length === 0) return model;

  const part = item.parts[toPartIndex(item.parts, current.part, delta)];
  return { ...model, current: target(item.target.path, part) };
}

function toPartIndex(
  parts: readonly t.KeyValue.Cursor.Part[],
  current: t.KeyValue.Cursor.Part | undefined,
  delta: 1 | -1,
) {
  if (!current) return delta < 0 ? 0 : parts.length - 1;

  const index = parts.indexOf(current);
  if (index < 0) return delta < 0 ? 0 : parts.length - 1;

  return Math.max(0, Math.min(parts.length - 1, index + delta));
}
