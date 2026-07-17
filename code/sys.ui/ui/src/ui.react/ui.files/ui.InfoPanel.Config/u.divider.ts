import type React from 'react';

import { Is, Keyboard, type t } from './common.ts';
import { fieldFromItem, isDividerItem, isField, isTitleField } from './u.fields.ts';

type ConfigItem = t.Files.InfoPanel.Config.Item;
type KeyboardEventLike = {
  readonly altKey: boolean;
  readonly ctrlKey: boolean;
  readonly defaultPrevented: boolean;
  readonly key: string;
  readonly metaKey: boolean;
  readonly shiftKey: boolean;
  readonly target?: EventTarget | null;
};

type InsertArgs = {
  readonly items: readonly ConfigItem[];
  readonly current?: t.KeyValue.Cursor.Target;
};

type HandlerArgs = InsertArgs & {
  readonly enabled: boolean;
  readonly onItemsChange?: NonNullable<t.Files.InfoPanel.Config.Props['onItemsChange']>;
};
type ClosestElement = { closest(selector: string): Element | null };

const cursorRootSelector = '[data-keyvalue-cursor-root]';
const interactiveSelector = [
  'a[href]',
  'button',
  'input',
  'select',
  'textarea',
  'summary',
  '[contenteditable="true"]',
  '[role="button"]',
  '[role="checkbox"]',
  '[role="combobox"]',
  '[role="link"]',
  '[role="menuitem"]',
  '[role="radio"]',
  '[role="slider"]',
  '[role="spinbutton"]',
  '[role="switch"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** Resolve a host-owned divider insertion keyboard handler. */
export function toDividerInsertionHandler(
  args: HandlerArgs,
): React.KeyboardEventHandler<HTMLElement> | undefined {
  if (!args.enabled) return undefined;
  if (!args.onItemsChange) return undefined;
  if (!args.current) return undefined;

  return (event) => {
    if (!isDividerInsertionKeyboardEvent(event)) return;

    const next = insertDividerAfterCursor({ items: args.items, current: args.current });
    if (!next) return;

    event.preventDefault();
    event.stopPropagation();
    args.onItemsChange?.({ next });
  };
}

/** True when a keyboard event is the host divider-insertion gesture. */
export function isDividerInsertionKeyboardEvent(event: KeyboardEventLike): boolean {
  if (event.defaultPrevented) return false;
  if (event.key !== 'Enter') return false;
  if (!event.altKey) return false;
  if (event.shiftKey) return false;
  if (isFromInteractiveDescendant(event)) return false;

  const modifiers = Keyboard.modifiers(event);
  if (Keyboard.Is.command(modifiers)) return false;
  if (modifiers.ctrl || modifiers.meta) return false;
  return true;
}

/** Insert a new divider after the current visible top-level cursor atom. */
export function insertDividerAfterCursor(args: InsertArgs): ConfigItem[] | undefined {
  const index = insertionIndex(args.items, args.current);
  if (index < 0) return undefined;
  if (wouldCreateAdjacentDivider(args.items, index)) return undefined;

  const divider: t.Files.InfoPanel.Config.Item.Divider = {
    kind: 'divider',
    id: nextDividerId(args.items),
  };
  return [...args.items.slice(0, index + 1), divider, ...args.items.slice(index + 1)];
}

/**
 * Helpers:
 */
function insertionIndex(
  items: readonly ConfigItem[],
  current?: t.KeyValue.Cursor.Target,
): number {
  const root = current?.path[0];
  if (!Is.string(root)) return -1;
  if (root === 'group:title' || isTitleTarget(root)) return titleInsertionIndex(items);

  return items.findIndex((item) => {
    if (isDividerItem(item)) return item.id === root;
    return fieldFromItem(item) === root;
  });
}

function isTitleTarget(target: string): boolean {
  return isField(target) && isTitleField(target);
}

function wouldCreateAdjacentDivider(items: readonly ConfigItem[], index: number): boolean {
  const current = index >= 0 && index < items.length ? items[index] : undefined;
  const nextIndex = index + 1;
  const next = nextIndex >= 0 && nextIndex < items.length ? items[nextIndex] : undefined;
  return (current !== undefined && isDividerItem(current)) ||
    (next !== undefined && isDividerItem(next));
}

function titleInsertionIndex(items: readonly ConfigItem[]): number {
  let index = -1;
  items.forEach((item, i) => {
    const field = fieldFromItem(item);
    if (field && isTitleField(field)) index = i;
  });
  return index;
}

function isFromInteractiveDescendant(event: KeyboardEventLike): boolean {
  const target = toElement(event.target);
  if (!target) return false;

  const cursorRoot = target.closest(cursorRootSelector);
  const interactive = target.closest(interactiveSelector);
  if (!interactive) return false;
  return interactive !== cursorRoot;
}

function toElement(target: EventTarget | null | undefined): ClosestElement | undefined {
  if (!Is.object(target)) return undefined;
  const candidate = target as Partial<ClosestElement>;
  return Is.func(candidate.closest) ? candidate as ClosestElement : undefined;
}

function nextDividerId(items: readonly ConfigItem[]): string {
  const existing = new Set(
    items.flatMap((item) => isDividerItem(item) ? [item.id] : []),
  );

  let index = 1;
  while (existing.has(`divider:${index}`)) index += 1;
  return `divider:${index}`;
}
