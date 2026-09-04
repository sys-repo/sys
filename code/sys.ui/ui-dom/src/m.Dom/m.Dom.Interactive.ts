import { Is, type t } from './common.ts';

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

/** Helpers for identifying conventional interactive/focusable DOM descendants. */
export const Interactive: t.Dom.Interactive.Lib = {
  closest,
  Is: {
    at(target, options = {}) {
      return !!closest(target, options);
    },

    within(target, boundary, options = {}) {
      const interactive = closest(target, options);
      if (!interactive) return false;
      return interactive === boundary || boundary.contains(interactive);
    },
  },
};

function closest(
  target: EventTarget | null | undefined,
  options: t.Dom.Interactive.Options = {},
): Element | undefined {
  let element = toElement(target);
  while (element) {
    if (element.matches(INTERACTIVE_SELECTOR) && element !== options.ignore) return element;
    element = element.parentElement ?? undefined;
  }
  return undefined;
}

function toElement(target: EventTarget | null | undefined): Element | undefined {
  if (!Is.object(target)) return undefined;
  const node = target as Partial<Node> & { readonly parentElement?: Element | null };
  if (node.nodeType === 1) return target as Element;
  return node.parentElement ?? undefined;
}
