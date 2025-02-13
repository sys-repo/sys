import { type t, DEFAULTS, pkg, toHash, toString, V } from './common.ts';
import { AlphanumericWithHyphens } from './u.ts';

type Prefix = string;
const singletons = new Map<Prefix, t.CssDom>();
let _sheet: CSSStyleSheet | null = null;

/**
 * Generator factory
 */
export const create: t.CssDomLib['create'] = (prefix) => {
  prefix = ((prefix ?? '').trim() || DEFAULTS.prefix).replace(/-*$/, '');
  V.parse(AlphanumericWithHyphens, prefix);
  if (singletons.has(prefix)) return singletons.get(prefix)!;

  const sheet = getStyleSheet();
  const inserted = new Set<string>();

  const api: t.CssDom = {
    prefix,
    get classes() {
      return Array.from(inserted);
    },
    class(style, hxInput) {
      const hx = hxInput ?? toHash(style);
      const className = `${prefix}-${hx}`;
      if (inserted.has(className)) {
        return className;
      } else {
        const rule = `.${className} { ${toString(style)} }`;
        sheet.insertRule(rule, sheet.cssRules.length);
        inserted.add(className);
        return className;
      }
    },
  };

  singletons.set(prefix, api);
  return api;
};

/**
 * Helpers
 */

/**
 * Singleton <style> element management.
 * If one doesn't exist, we create one and append it to the <head>.
 */
function getStyleSheet(): CSSStyleSheet {
  if (_sheet) return _sheet;

  const el = document.createElement('style');
  el.setAttribute('data-controller', pkg.name);

  document.head.appendChild(el);
  _sheet = el.sheet as CSSStyleSheet;
  return _sheet;
}
