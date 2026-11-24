import { Is, Style, type t } from '../common.ts';

export const outline: t.FocusStyle.Paint = {
  arrival: { outlineColor: 'blue' },
  settled: { outline: '2px solid lightblue', outlineOffset: '2px' },
  forcedColors: { outline: '2px solid Highlight', outlineOffset: '2px' },
};

export const halo: t.FocusStyle.Paint = {
  arrival: { boxShadow: '0 0 0 3px green' },
  settled: { boxShadow: '0 0 0 3px palegreen' },
  forcedColors: { outline: '2px solid Highlight', outlineOffset: '2px', boxShadow: 'none' },
};

/** Owner declarations only; these helpers do not simulate browser focus or animation. */
export function rules(target: t.FocusStyle.Target) {
  const selector = `.${target.class}`;
  const selectors = [selector, `${selector}:focus-visible`];
  const items = Style.Dom.stylesheet().rules.items;
  return items.filter((item) => selectors.includes(item.selector));
}

/** Focus declarations may be absent for child-owned or explicitly cleared indication. */
export function focus(target: t.FocusStyle.Target) {
  return ordinaryRule(target, ':focus-visible')?.style;
}

/** Every composed target must register its base declarations. */
export function base(target: t.FocusStyle.Target) {
  const rule = ordinaryRule(target);
  if (Is.nil(rule)) throw new Error(`Missing base CSS rule: .${target.class}`);
  return rule.style;
}

/** Look up ordinary declarations without mistaking preference rules for default paint. */
function ordinaryRule(target: t.FocusStyle.Target, pseudo = '') {
  const selector = `.${target.class}${pseudo}`;
  return rules(target).find((item) => {
    if (item.selector !== selector) return false;
    return !item.rule.startsWith('@media');
  });
}
