import { Is, Style } from '../common.ts';

/** Inspect emitted declarations, not mock focus-visible matching or painted appearance. */
export function ruleText(el: Element, pseudo = '') {
  const selector = `.${el.className}${pseudo}`;
  const items = Style.Dom.stylesheet().rules.items;
  const rule = items.find((item) => item.selector === selector);
  if (Is.nil(rule)) throw new Error(`Missing CSS rule: ${selector}`);
  return rule.rule;
}
