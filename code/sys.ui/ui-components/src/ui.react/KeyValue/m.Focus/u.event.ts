import type React from 'react';
import { Keyboard, type t } from '../common.ts';
import { Focus } from './mod.ts';
import { Data } from './u.render.ts';

export type EntryEvent = Pick<
  React.MouseEvent<HTMLElement>,
  | 'altKey'
  | 'ctrlKey'
  | 'metaKey'
  | 'shiftKey'
  | 'button'
  | 'currentTarget'
  | 'defaultPrevented'
  | 'target'
>;

export function entryMode(input?: t.KeyValue.Focus.Entry): t.KeyValue.Focus.EntryMode | undefined {
  if (input === false) return undefined;
  return input ?? 'option-click';
}

export function shouldEnter(event: EntryEvent, input?: t.KeyValue.Focus.Entry): boolean {
  const mode = entryMode(input);
  if (!mode) return false;
  if (event.defaultPrevented) return false;
  if (event.button !== 0) return false;
  if (mode === 'option-click' && !isOptionClick(event)) return false;
  if (isFromNestedBoundary(event)) return false;
  if (isFromInteractiveDescendant(event)) return false;
  return true;
}

export function toEntryChange(args: {
  readonly entry: t.KeyValue.Focus.EntryMode;
  readonly model: t.KeyValue.Focus.Model;
  readonly items: readonly t.KeyValue.Item[];
  readonly ref: t.KeyValue.Focus.Ref;
}): t.KeyValue.Focus.Change | undefined {
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

function isFromInteractiveDescendant(event: EntryEvent) {
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
