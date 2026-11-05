import { Is, Style } from '../common.ts';

/** Inspect emitted declarations, not mock focus-visible matching or painted appearance. */
export function ruleText(el: Element, pseudo = '') {
  const selector = `.${el.className}${pseudo}`;
  const items = Style.Dom.stylesheet().rules.items;
  const rule = items.find((item) => item.selector === selector);
  if (Is.nil(rule)) throw new Error(`Missing CSS rule: ${selector}`);
  return rule.rule;
}

/** Inspect registered media declarations, not browser preference matching. */
export function mediaRules(el: Element) {
  const selector = `.${el.className}`;
  const selectors = [selector, `${selector}:focus-visible`];
  const items = Style.Dom.stylesheet().rules.items;
  const media = items.filter((item) => item.rule.startsWith('@media'));
  return media.filter((item) => selectors.includes(item.selector)).map((item) => item.rule);
}
