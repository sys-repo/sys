import { Is, Obj, type t } from '../common.ts';
import { DataAttr } from '../../KeyValue/m.Cursor/u/u.render.ts';
import { toToggleArgs } from './u.interaction.ts';
import { SwitchesIs } from './u.is.ts';

type ResolveResult = {
  readonly item: t.KeyValueSwitches.Row;
  readonly index: number;
  readonly target: t.KeyValue.Cursor.Target;
};

export function toggleCursorSpace(args: {
  readonly event: t.ReactKeyboardEvent<HTMLElement>;
  readonly items?: readonly t.KeyValueSwitches.Item[];
  readonly enabled?: boolean;
  readonly cursor?: t.KeyValue.Cursor.Props;
}): boolean {
  const { event, cursor } = args;
  if (!isSpace(event)) return false;
  if (isModified(event)) return false;
  if (!isFromCursorRoot(event)) return false;
  if (cursor?.enabled === false) return false;

  const current = cursor?.model?.current;
  if (!current) return false;

  const match = resolveCursorTarget(args.items ?? [], current);
  if (!match) return true;

  const toggle = toToggleArgs({
    item: match.item,
    index: match.index,
    enabled: args.enabled,
    target: match.target,
    source: { kind: 'cursor-keyboard', event },
  });
  if (toggle) match.item.onToggle?.(toggle);
  return true;
}

export function resolveCursorTarget(
  items: readonly t.KeyValueSwitches.Item[],
  target: t.KeyValue.Cursor.Target,
): ResolveResult | undefined {
  if (target.part === 'key') return undefined;
  if (target.part && target.part !== 'value') return undefined;
  if (target.path.length === 0) return undefined;

  const row = resolveRow(items, target.path);
  if (!row) return undefined;
  return { ...row, target: toTarget(target) };
}

function resolveRow(
  items: readonly t.KeyValueSwitches.Item[],
  path: t.ObjectPath,
): Pick<ResolveResult, 'item' | 'index'> | undefined {
  const [head, ...tail] = path;
  if (!isStableId(head)) return undefined;
  if (duplicateIds(items).has(head)) return undefined;

  const index = items.findIndex((item) => item.id === head);
  if (index < 0) return undefined;

  const item = items[index];
  if (!item || SwitchesIs.hr(item)) return undefined;
  if (SwitchesIs.group(item)) return tail.length ? resolveRow(item.items, tail) : undefined;
  return tail.length ? undefined : { item, index };
}

function toTarget(target: t.KeyValue.Cursor.Target): t.KeyValue.Cursor.Target {
  const path = Obj.Path.slice(target.path, 0);
  return target.part ? { path, part: target.part } : { path };
}

function isSpace(event: t.ReactKeyboardEvent<HTMLElement>) {
  return event.key === ' ' || event.key === 'Spacebar';
}

function isModified(event: t.ReactKeyboardEvent<HTMLElement>) {
  return event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
}

function isFromCursorRoot(event: t.ReactKeyboardEvent<HTMLElement>) {
  const target = toElement(event.target);
  return target?.getAttribute(DataAttr.root) === 'true';
}

function toElement(target: EventTarget | null): Element | undefined {
  if (!target) return undefined;
  const node = target as Partial<Node> & Partial<Element>;
  if (node.nodeType === 1 && node.getAttribute) return node as Element;
  return node.parentElement ?? undefined;
}

function duplicateIds(items: readonly t.KeyValueSwitches.Item[]): ReadonlySet<string> {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  items.forEach((item) => {
    const id = item.id;
    if (!isStableId(id)) return;
    if (seen.has(id)) duplicates.add(id);
    else seen.add(id);
  });

  return duplicates;
}

function isStableId(id: unknown): id is string {
  return Is.string(id) && !Is.blank(id);
}
