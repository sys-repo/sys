import { type t, DEFAULT, isRecord, pkg, toHash, V } from './common.ts';
import { AlphanumericWithHyphens, toString } from './u.ts';

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

  const sheet = getOrCreateCSSStyleSheet();
  const insertedClasses = new Set<string>();
  const insertedRules = new Set<string>();
  const insertRule = (rule: string) => {
    if (insertedRules.has(rule)) return;
    sheet.insertRule?.(rule, sheet.cssRules.length);
    insertedRules.add(rule);
  };

  const api: t.CssDomStylesheet = {
    prefix,
    get classes() {
      return Array.from(insertedClasses);
    },

    class(style, hxInput) {
      const hx = hxInput ?? toHash(style);
      const className = `${prefix}-${hx}`;
      if (insertedClasses.has(className)) return className;

      // Initial creation.
      insertedClasses.add(className);
      api.rule(`.${className}`, style);

      return className;
    },

    rule(selector, style) {
      insertRule(`${selector} { ${toString(style)} }`);
      Object.entries(style)
        .filter(([key]) => DEFAULT.pseudoClasses.has(key))
        .filter(([_, value]) => isRecord(value))
        .forEach(([key, value]) => insertRule(`${selector}${key} { ${toString(value)} }`));
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
function getOrCreateCSSStyleSheet(): CSSStyleSheet {
  if (_sheet) return _sheet;

  if (typeof document === 'undefined') {
    return {} as CSSStyleSheet; // Dummy (safe on server).
  } else {
    const el = document.createElement('style');
    el.setAttribute('data-controller', pkg.name);
    document.head.appendChild(el);
    _sheet = el.sheet as CSSStyleSheet;
    return _sheet;
  }
}
