import { Is, Style } from '../common.ts';

/** Locate the native control, not its track or thumb. */
export function button(container: HTMLElement) {
  const el = container.querySelector<HTMLButtonElement>('button[role="switch"]');
  if (Is.nil(el)) throw new Error('Expected Switch button.');
  return el;
}

/** Registered declarations only, not browser selector matching or painted appearance. */
export function rules(el: Element) {
  const selector = `.${el.className}`;
  const selectors = [selector, `${selector}:focus`, `${selector}:focus-visible`];
  const items = Style.Dom.stylesheet().rules.items;
  return items.filter((item) => selectors.includes(item.selector));
}

/** Every rendered element must register ordinary base declarations. */
export function base(el: Element) {
  const rule = ordinaryRule(el);
  if (Is.nil(rule)) throw new Error(`Missing base CSS rule: .${el.className}`);
  return rule.style;
}

/** An explicit focus clear may omit the ordinary focus rule. */
export function focus(el: Element) {
  return ordinaryRule(el, ':focus-visible')?.style;
}

function ordinaryRule(el: Element, pseudo = '') {
  const selector = `.${el.className}${pseudo}`;
  return rules(el).find((item) => {
    if (item.selector !== selector) return false;
    return !item.rule.startsWith('@media');
  });
}
