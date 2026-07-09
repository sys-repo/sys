import type React from 'react';
import { Keyboard, type t } from '../common.ts';
import { Focus } from './mod.ts';
import { Data } from './u.render.ts';

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
  readonly navigation: t.KeyValue.Focus.NavigationMode;
  readonly key: t.KeyValue.Focus.NavigationKey;
  readonly command: t.KeyValue.Focus.Command<'focus:next' | 'focus:previous' | 'focus:enter' | 'focus:exit'>;
};

export function entryMode(input?: t.KeyValue.Focus.Entry): t.KeyValue.Focus.EntryMode | undefined {
  if (input === false) return undefined;
  return input ?? 'option-click';
}

export function navigationMode(input?: t.KeyValue.Focus.Navigation): t.KeyValue.Focus.NavigationMode | undefined {
  if (input === false) return undefined;
  return input ?? 'keyboard';
}

export function isFocusEntryClick(event: EntryEvent, input?: t.KeyValue.Focus.Entry): boolean {
  const mode = entryMode(input);
  if (!mode) return false;
  if (event.defaultPrevented) return false;
  if (event.button !== 0) return false;
  if (mode === 'option-click' && !isOptionClick(event)) return false;
  return true;
}

export function shouldEnter(event: EntryEvent, input?: t.KeyValue.Focus.Entry): boolean {
  if (!isFocusEntryClick(event, input)) return false;
  if (isFromNestedBoundary(event)) return false;
  if (isFromInteractiveDescendant(event)) return false;
  return true;
}

export function toEntryChange(args: {
  readonly entry: t.KeyValue.Focus.EntryMode;
  readonly model: t.KeyValue.Focus.Model;
  readonly items: readonly t.KeyValue.Item[];
  readonly ref: t.KeyValue.Focus.Ref;
}): t.KeyValue.Focus.EntryChange | undefined {
  const target = Focus.ref(args.ref.path);
  const command: t.KeyValue.Focus.Command<'focus:set'> = {
    name: 'focus:set',
    payload: { ref: target },
  };
  const previous = args.model;
  const next = Focus.apply(previous, args.items, command);
  if (!Focus.eql(next.active, target)) return undefined;
  return { reason: 'focus:entry', entry: args.entry, previous, next, ref: Focus.ref(target.path), command };
}

export function toNavigationIntent(
  event: NavigationEvent,
  input?: t.KeyValue.Focus.Navigation,
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
  readonly model: t.KeyValue.Focus.Model;
  readonly items: readonly t.KeyValue.Item[];
  readonly intent: NavigationIntent;
}): t.KeyValue.Focus.NavigationChange | undefined {
  const previous = args.model;
  if (!previous.active) return undefined;

  const next = Focus.apply(previous, args.items, args.intent.command);
  if (Focus.eql(previous.active, next.active)) return undefined;
  return {
    reason: 'focus:navigation',
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
  const boundary = target.closest(`[${Data.boundary}]`);
  return !!boundary && boundary !== current;
}

function isModified(event: NavigationEvent) {
  const modifiers = Keyboard.modifiers(event);
  return modifiers.alt || modifiers.ctrl || modifiers.meta || modifiers.shift;
}

function commandFromKey(
  key: string,
): Pick<NavigationIntent, 'key' | 'command'> | undefined {
  if (key === 'ArrowDown') return { key, command: { name: 'focus:next', payload: {} } };
  if (key === 'ArrowUp') return { key, command: { name: 'focus:previous', payload: {} } };
  if (key === 'Enter') return { key, command: { name: 'focus:enter', payload: {} } };
  if (key === 'Escape') return { key, command: { name: 'focus:exit', payload: {} } };
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
