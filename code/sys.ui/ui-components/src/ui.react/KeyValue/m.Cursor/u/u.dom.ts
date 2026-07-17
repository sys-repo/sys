import { Dom } from '../../common.ts';
import { DataAttr } from './u.render.ts';

export function cursorRoot(host?: HTMLElement) {
  return host?.querySelector<HTMLElement>(`[${DataAttr.root}]`);
}

export function activeElementWithin(root: HTMLElement): Element | undefined {
  const active = globalThis.document?.activeElement;
  if (!active) return undefined;
  return active === root || root.contains(active) ? active : undefined;
}

export function focusCursorRoot(root: HTMLElement) {
  root.focus({ preventScroll: true });
  return globalThis.document?.activeElement === root;
}

export function shouldLetKeyValueHandle(root: HTMLElement) {
  const active = globalThis.document?.activeElement;
  if (!active) return false;
  if (!active.isConnected) return false;
  if (active === root || root.contains(active)) return true;
  if (active === globalThis.document?.body) return false;
  return Dom.Interactive.Is.at(active);
}

export function isInteractiveElement(element: Element, cursorRoot: Element | null): boolean {
  return Dom.Interactive.Is.at(element, { ignore: cursorRoot });
}

export function toElement(target: EventTarget | null): Element | undefined {
  if (!target) return undefined;
  const node = target as Partial<Node> & Partial<Element>;
  if (node.nodeType === 1 && node.closest) return node as Element;
  return node.parentElement ?? undefined;
}
