import type React from 'react';
import { Keyboard, type t } from '../../common.ts';
import { Cursor } from '../mod.ts';
import { INTERACTIVE_SELECTOR, toElement } from './u.dom.ts';
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
  readonly command: t.KeyValue.Cursor.Command<t.KeyValue.Cursor.NavigationCommandName>;
};

export type KeyboardEntryInput = Extract<
  t.KeyValue.Cursor.EntryInput,
  'option-enter' | 'option-arrow-left' | 'option-arrow-right'
>;

export function entryMode(
  input?: t.KeyValue.Cursor.Entry,
): t.KeyValue.Cursor.EntryMode | undefined {
  if (input === false) return undefined;
  return input ?? 'option-click';
}

export function navigationMode(
  input?: t.KeyValue.Cursor.Navigation,
): t.KeyValue.Cursor.NavigationMode | undefined {
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

export function shouldRetarget(
  event: EntryEvent,
  model: t.KeyValue.Cursor.Model,
): boolean {
  if (!model.current) return false;
  if (!isPlainPrimaryClick(event)) return false;
  if (isFromNestedBoundary(event)) return false;
  if (isFromInteractiveDescendant(event)) return false;
  return true;
}

export function toEntryChange(args: {
  readonly entry: t.KeyValue.Cursor.EntryInput;
  readonly model: t.KeyValue.Cursor.Model;
  readonly items: t.KeyValue.Item[];
  readonly target: t.KeyValue.Cursor.Target;
}): t.KeyValue.Cursor.EntryChange | undefined {
  const nextTarget = Cursor.target(args.target.path, args.target.part);
  const command: t.KeyValue.Cursor.Command<'cursor:set'> = {
    name: 'cursor:set',
    payload: { target: nextTarget },
  };
  const previous = args.model;
  const next = Cursor.cmd(previous, args.items, command);
  if (!Cursor.eql(next.current, nextTarget)) return undefined;
  return {
    reason: 'cursor:entry',
    entry: args.entry,
    previous,
    next,
    target: nextTarget,
    command,
  };
}

export function toKeyboardEntryChange(args: {
  readonly event: NavigationEvent;
  readonly entry?: t.KeyValue.Cursor.Entry;
  readonly model: t.KeyValue.Cursor.Model;
  readonly items: t.KeyValue.Item[];
}): t.KeyValue.Cursor.EntryChange | undefined {
  if (args.entry === false) return undefined;
  if (args.event.defaultPrevented) return undefined;
  if (args.model.current) return undefined;
  if (isFromInteractiveDescendant(args.event)) return undefined;

  const input = keyboardEntryInput(args.event);
  if (!input) return undefined;

  const part = input === 'option-arrow-left'
    ? 'key'
    : input === 'option-arrow-right'
    ? 'value'
    : undefined;
  const target = firstEntryTarget(args.items, part);
  if (!target) return undefined;
  return toEntryChange({ entry: input, model: args.model, items: args.items, target });
}

export function toNavigationIntent(
  event: NavigationEvent,
  input?: t.KeyValue.Cursor.Navigation,
): NavigationIntent | undefined {
  const mode = navigationMode(input);
  if (!mode) return undefined;
  if (event.defaultPrevented) return undefined;
  if (
    !isUnmodifiedNavigation(event) && !isOptionLaneNavigation(event) &&
    !isOptionBlockNavigation(event) && !isCommandEdgeNavigation(event)
  ) return undefined;
  if (isFromInteractiveDescendant(event)) return undefined;

  const match = commandFromEvent(event);
  if (!match) return undefined;
  return { navigation: mode, key: match.key, command: match.command };
}

export function toNavigationChange(args: {
  readonly model: t.KeyValue.Cursor.Model;
  readonly items: t.KeyValue.Item[];
  readonly intent: NavigationIntent;
}): t.KeyValue.Cursor.NavigationChange | undefined {
  const previous = args.model;
  if (!previous.current) return undefined;

  const next = Cursor.cmd(previous, args.items, args.intent.command);
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
  return isOptionOnly(Keyboard.modifiers(event));
}

function isPlainPrimaryClick(event: EntryEvent) {
  if (event.defaultPrevented) return false;
  if (event.button !== 0) return false;
  return !Keyboard.Is.modified(Keyboard.modifiers(event));
}

function isFromNestedBoundary(event: EntryEvent) {
  const target = toElement(event.target);
  const current = event.currentTarget;
  if (!target) return false;
  const boundary = target.closest(`[${DataAttr.boundary}]`);
  return !!boundary && boundary !== current;
}

function keyboardEntryInput(event: NavigationEvent): KeyboardEntryInput | undefined {
  if (!isOptionOnly(Keyboard.modifiers(event))) return undefined;
  if (event.key === 'Enter') return 'option-enter';
  if (event.key === 'ArrowLeft') return 'option-arrow-left';
  if (event.key === 'ArrowRight') return 'option-arrow-right';
  return undefined;
}

function firstEntryTarget(
  items: t.KeyValue.Item[],
  part?: t.KeyValue.Cursor.Part,
): t.KeyValue.Cursor.Target | undefined {
  const scope = Cursor.scope(items);
  const item = part ? scope.items.find((item) => item.parts.includes(part)) : scope.items[0];
  if (!item) return undefined;
  const currentPart = part && item.parts.includes(part) ? part : undefined;
  return Cursor.target(item.target.path, currentPart);
}

function isUnmodifiedNavigation(event: NavigationEvent) {
  if (isLaneNavigationKey(event.key)) return false;
  return !Keyboard.Is.modified(Keyboard.modifiers(event));
}

function isOptionLaneNavigation(event: NavigationEvent) {
  if (!isLaneNavigationKey(event.key)) return false;
  return isOptionOnly(Keyboard.modifiers(event));
}

function isOptionBlockNavigation(event: NavigationEvent) {
  if (!isVerticalNavigationKey(event.key)) return false;
  return isOptionOnly(Keyboard.modifiers(event));
}

function isCommandEdgeNavigation(event: NavigationEvent) {
  if (!isVerticalNavigationKey(event.key)) return false;
  return isCommandOnly(Keyboard.modifiers(event));
}

function isLaneNavigationKey(key: string) {
  return key === 'ArrowLeft' || key === 'ArrowRight';
}

function isVerticalNavigationKey(key: string) {
  return key === 'ArrowUp' || key === 'ArrowDown';
}

function isOptionOnly(modifiers: t.Keyboard.Modifier.Flags) {
  return modifiers.alt && !modifiers.ctrl && !modifiers.meta && !modifiers.shift;
}

function isCommandOnly(modifiers: t.Keyboard.Modifier.Flags) {
  if (!Keyboard.Is.command(modifiers)) return false;
  if (modifiers.alt || modifiers.shift) return false;
  if (modifiers.ctrl && modifiers.meta) return false;
  return true;
}

function commandFromEvent(
  event: NavigationEvent,
): Pick<NavigationIntent, 'key' | 'command'> | undefined {
  const key = event.key;
  const modifiers = Keyboard.modifiers(event);
  const option = isOptionOnly(modifiers);
  const edge = isCommandOnly(modifiers);
  if (key === 'End') return { key, command: { name: 'cursor:last', payload: {} } };
  if (key === 'Home') return { key, command: { name: 'cursor:first', payload: {} } };
  if (key === 'ArrowDown') {
    return {
      key,
      command: {
        name: edge ? 'cursor:last' : option ? 'cursor:next-block' : 'cursor:next',
        payload: {},
      },
    };
  }
  if (key === 'ArrowUp') {
    return {
      key,
      command: {
        name: edge ? 'cursor:first' : option ? 'cursor:previous-block' : 'cursor:previous',
        payload: {},
      },
    };
  }
  if (key === 'ArrowLeft') return { key, command: { name: 'cursor:left', payload: {} } };
  if (key === 'ArrowRight') return { key, command: { name: 'cursor:right', payload: {} } };
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
