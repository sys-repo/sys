import { expect, type t } from '../../../-test.ts';
import { KeyValue } from '../mod.ts';

export const boundarySelector = '[data-keyvalue-item-boundary]';
export const currentSelector = '[data-keyvalue-cursor-current="true"]';

export function row(id: string): t.KeyValue.Item.Row {
  return { id, k: id, v: id };
}

export function target(...path: t.ObjectPath): t.KeyValue.Cursor.Target {
  return KeyValue.Cursor.target(path);
}

export function firstChild(container: HTMLElement) {
  return container.firstElementChild as HTMLElement;
}

export function firstBoundary(container: HTMLElement) {
  return container.querySelector(boundarySelector) as HTMLElement;
}

export function currentBoundary(container: HTMLElement) {
  return container.querySelector(currentSelector) as HTMLElement;
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
