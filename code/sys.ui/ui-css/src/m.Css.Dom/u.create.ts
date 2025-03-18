import { type t, DEFAULT, isRecord, pkg, toHash, toString, V } from './common.ts';
import { AlphanumericWithHyphens } from './u.ts';

type Prefix = string;
const singletons = new Map<Prefix, t.CssDomStylesheet>();
let _sheet: CSSStyleSheet | null = null;

/**
 * Generator factory
 */
export const createStylesheet: t.CssDomLib['stylesheet'] = (prefix) => {
  prefix = ((prefix ?? '').trim() || DEFAULT.prefix).replace(/-*$/, '');
  V.parse(AlphanumericWithHyphens, prefix);
  if (singletons.has(prefix)) return singletons.get(prefix)!;

  const sheet = getOrCreateStylesheet();
  const inserted = new Set<string>();
  const insertRule = (rule: string) => sheet.insertRule?.(rule, sheet.cssRules.length);

  const api: t.CssDomStylesheet = {
    prefix,
    get classes() {
      return Array.from(inserted);
    },
    class(style, hxInput) {
      const hx = hxInput ?? toHash(style);
      const className = `${prefix}-${hx}`;
      if (inserted.has(className)) return className;

      // Initial creation.
      inserted.add(className);
      insertRule(`.${className} { ${toString(style)} }`);

      Object.entries(style)
        .filter(([key]) => DEFAULT.pseudoClasses.has(key))
        .filter(([_, value]) => isRecord(value))
        .forEach(([key, value]) => insertRule(`.${className}${key} { ${toString(value)} }`));

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
    return {} as CSSStyleSheet; // Dummy (NB: safe when running on server).
  } else {
    const el = document.createElement('style');
    el.setAttribute('data-controller', pkg.name);
    document.head.appendChild(el);
    _sheet = el.sheet as CSSStyleSheet;
    return _sheet;
  }
}
