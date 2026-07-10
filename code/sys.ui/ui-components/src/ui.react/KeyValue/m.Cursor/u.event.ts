import type React from 'react';
import { Keyboard, type t } from '../common.ts';
import { Cursor } from './mod.ts';
import { DataAttr } from './u.render.ts';

export type EntryEvent = Pick<
  React.MouseEvent<Element>,
  | 'altKey'
  | 'ctrlKey'
  | 'metaKey'
  | 'shiftKey'
  | 'button'
  | 'currentTarget'
  | 'defaultPrevented'
  | 'target'
>;

export type NavigationEvent = Pick<
  React.KeyboardEvent<HTMLElement>,
  | 'altKey'
  | 'ctrlKey'
  | 'metaKey'
  | 'shiftKey'
  | 'currentTarget'
  | 'defaultPrevented'
  | 'key'
  | 'target'
>;

export type NavigationIntent = {
  readonly navigation: t.KeyValue.Cursor.NavigationMode;
  readonly key: t.KeyValue.Cursor.NavigationKey;
  readonly command: t.KeyValue.Cursor.Command<'cursor:next' | 'cursor:previous' | 'cursor:enter' | 'cursor:exit'>;
};

export function entryMode(input?: t.KeyValue.Cursor.Entry): t.KeyValue.Cursor.EntryMode | undefined {
  if (input === false) return undefined;
  return input ?? 'option-click';
}

export function navigationMode(input?: t.KeyValue.Cursor.Navigation): t.KeyValue.Cursor.NavigationMode | undefined {
  if (input === false) return undefined;
  return input ?? 'keyboard';
}

export function isCursorEntryClick(event: EntryEvent, input?: t.KeyValue.Cursor.Entry): boolean {
  const mode = entryMode(input);
  if (!mode) return false;
  if (event.defaultPrevented) return false;
  if (event.button !== 0) return false;
  if (mode === 'option-click' && !isOptionClick(event)) return false;
  return true;
}

export function shouldEnter(event: EntryEvent, input?: t.KeyValue.Cursor.Entry): boolean {
  if (!isCursorEntryClick(event, input)) return false;
  if (isFromNestedBoundary(event)) return false;
  if (isFromInteractiveDescendant(event)) return false;
  return true;
}

export function toEntryChange(args: {
  readonly entry: t.KeyValue.Cursor.EntryMode;
  readonly model: t.KeyValue.Cursor.Model;
  readonly items: readonly t.KeyValue.Item[];
  readonly target: t.KeyValue.Cursor.Target;
}): t.KeyValue.Cursor.EntryChange | undefined {
  const nextTarget = Cursor.target(args.target.path);
  const command: t.KeyValue.Cursor.Command<'cursor:set'> = {
    name: 'cursor:set',
    payload: { target: nextTarget },
  };
  const previous = args.model;
  const next = Cursor.apply(previous, args.items, command);
  if (!Cursor.eql(next.current, nextTarget)) return undefined;
  return {
    reason: 'cursor:entry',
    entry: args.entry,
    previous,
    next,
    target: Cursor.target(nextTarget.path),
    command,
  };
}

export function toNavigationIntent(
  event: NavigationEvent,
  input?: t.KeyValue.Cursor.Navigation,
): NavigationIntent | undefined {
  const mode = navigationMode(input);
  if (!mode) return undefined;
  if (event.defaultPrevented) return undefined;
  if (isModified(event)) return undefined;
  if (isFromInteractiveDescendant(event)) return undefined;

  const match = commandFromKey(event.key);
  if (!match) return undefined;
  return { navigation: mode, key: match.key, command: match.command };
}

export function toNavigationChange(args: {
  readonly model: t.KeyValue.Cursor.Model;
  readonly items: readonly t.KeyValue.Item[];
  readonly intent: NavigationIntent;
}): t.KeyValue.Cursor.NavigationChange | undefined {
  const previous = args.model;
  if (!previous.current) return undefined;

  const next = Cursor.apply(previous, args.items, args.intent.command);
  if (Cursor.eql(previous.current, next.current)) return undefined;
  return {
    reason: 'cursor:navigation',
    navigation: args.intent.navigation,
    key: args.intent.key,
    previous,
    next,
    command: args.intent.command,
  };
}

function isOptionClick(event: EntryEvent) {
  const modifiers = Keyboard.modifiers(event);
  return modifiers.alt && !modifiers.ctrl && !modifiers.meta && !modifiers.shift;
}

function isFromNestedBoundary(event: EntryEvent) {
  const target = toElement(event.target);
  const current = event.currentTarget;
  if (!target) return false;
  const boundary = target.closest(`[${DataAttr.boundary}]`);
  return !!boundary && boundary !== current;
}

function isModified(event: NavigationEvent) {
  const modifiers = Keyboard.modifiers(event);
  return modifiers.alt || modifiers.ctrl || modifiers.meta || modifiers.shift;
}

function commandFromKey(
  key: string,
): Pick<NavigationIntent, 'key' | 'command'> | undefined {
  if (key === 'ArrowDown') return { key, command: { name: 'cursor:next', payload: {} } };
  if (key === 'ArrowUp') return { key, command: { name: 'cursor:previous', payload: {} } };
  if (key === 'Enter') return { key, command: { name: 'cursor:enter', payload: {} } };
  if (key === 'Escape') return { key, command: { name: 'cursor:exit', payload: {} } };
  return undefined;
}

function isFromInteractiveDescendant(event: EntryEvent | NavigationEvent) {
  const target = toElement(event.target);
  const current = event.currentTarget;
  if (!target || target === current) return false;
  const interactive = target.closest(INTERACTIVE_SELECTOR);
  return !!interactive && current.contains(interactive);
}

function toElement(target: EventTarget | null): Element | undefined {
  if (!target) return undefined;
  const node = target as Partial<Node> & Partial<Element>;
  if (node.nodeType === 1 && node.closest) return node as Element;
  return node.parentElement ?? undefined;
}

const INTERACTIVE_SELECTOR = [
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
