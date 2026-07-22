import { act, expect, type t } from '../../../-test.ts';
import { KeyValue } from '../mod.ts';

export const boundarySelector = '[data-keyvalue-item-boundary]';
export const currentSelector = '[data-keyvalue-cursor-current="true"]';
export const cursorRootSelector = '[data-keyvalue-cursor-root="true"]';

export function row(id: string): t.KeyValue.Item.Row {
  return { id, k: id, v: id };
}

export function target(...path: t.ObjectPath): t.KeyValue.Cursor.Target {
  return KeyValue.Cursor.target(path);
}

export function firstChild(container: HTMLElement) {
  const el = container.firstElementChild;
  if (el === null) throw new Error('Expected first child test element.');
  return el as HTMLElement;
}

export function firstBoundary(container: HTMLElement) {
  return selectElement(container, boundarySelector);
}

export function currentBoundary(container: HTMLElement) {
  return selectElement(container, currentSelector);
}

export function cursorRoot(container: HTMLElement) {
  return selectElement(container, cursorRootSelector);
}

export function focusRoot(container: HTMLElement) {
  const root = cursorRoot(container);
  act(() => root.focus());
  return root;
}

export function selectElement(container: HTMLElement, selector: string): HTMLElement {
  const el = container.querySelector(selector);
  if (el === null) throw new Error(`Expected test element matching selector: ${selector}`);
  return el as HTMLElement;
}

export function currentCells(container: HTMLElement) {
  const current = currentBoundary(container);
  const cells = Array.from(current.querySelectorAll<HTMLElement>('div'))
    .filter((el) => el.parentElement?.parentElement === current);
  return { key: cells[0], value: cells[1] };
}

export function visibleBackground(el: HTMLElement | undefined) {
  if (!el) return false;
  const backgroundColor = window.getComputedStyle(el).backgroundColor;
  return backgroundColor !== '' && backgroundColor !== 'rgba(0, 0, 0, 0)' &&
    backgroundColor !== 'transparent';
}

export function entryChange(
  change: t.KeyValue.Cursor.Change | undefined,
): t.KeyValue.Cursor.EntryChange {
  expect(change?.reason).to.eql('cursor:entry');
  return change as t.KeyValue.Cursor.EntryChange;
}

export function navigationChange(
  change: t.KeyValue.Cursor.Change | undefined,
): t.KeyValue.Cursor.NavigationChange {
  expect(change?.reason).to.eql('cursor:navigation');
  return change as t.KeyValue.Cursor.NavigationChange;
}
