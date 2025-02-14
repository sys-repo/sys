import { type t, DEFAULT, pkg, toHash, toString, V } from './common.ts';
import { AlphanumericWithHyphens } from './u.ts';

type Prefix = string;
const singletons = new Map<Prefix, t.CssDom>();
let _sheet: CSSStyleSheet | null = null;

/**
 * Generator factory
 */
export const create: t.CssDomLib['create'] = (prefix) => {
  prefix = ((prefix ?? '').trim() || DEFAULT.prefix).replace(/-*$/, '');
  V.parse(AlphanumericWithHyphens, prefix);
  if (singletons.has(prefix)) return singletons.get(prefix)!;

  const sheet = getOrCreateStylesheet();
  const inserted = new Set<string>();

  const api: t.CssDom = {
    prefix,
    get classes() {
      return Array.from(inserted);
    },
    class(style, hxInput) {
      const hx = hxInput ?? toHash(style);
      const className = `${prefix}-${hx}`;
      if (inserted.has(className)) return className;

      // Initial creation.
      const rule = `.${className} { ${toString(style)} }`;
      sheet.insertRule?.(rule, sheet.cssRules.length);
      inserted.add(className);
      return className;
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
function getOrCreateStylesheet(): CSSStyleSheet {
  if (_sheet) return _sheet;

  if (typeof document === 'undefined') {
    return {} as CSSStyleSheet; // Dummy.
  } else {
    const el = document.createElement('style');
    el.setAttribute('data-controller', pkg.name);
    document.head.appendChild(el);
    _sheet = el.sheet as CSSStyleSheet;
    return _sheet;
  }
}
