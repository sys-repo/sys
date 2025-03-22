import { type t, DEFAULT, isRecord, pkg, toHash, V } from './common.ts';
import { AlphanumericWithHyphens, toString } from './u.ts';

type Prefix = string;
const singletons = new Map<Prefix, t.CssDomStylesheet>();
let _sheet: CSSStyleSheet | null = null;

/**
 * Generator factory
 */
export const createStylesheet: t.CssDomLib['stylesheet'] = (options = {}) => {
  const classPrefix = ((options.classPrefix ?? '').trim() || DEFAULT.classPrefix).replace(
    /-*$/,
    '',
  );
  V.parse(AlphanumericWithHyphens, classPrefix);
  if (singletons.has(classPrefix)) return singletons.get(classPrefix)!;

  const sheet = getOrCreateCSSStyleSheet();
  const insertedClasses = new Set<string>();
  const insertedRules = new Set<string>();
  const insertRule = (rule: string) => {
    if (insertedRules.has(rule)) return;
    sheet.insertRule?.(rule, sheet.cssRules.length);
    insertedRules.add(rule);
  };

  const api: t.CssDomStylesheet = {
    classPrefix,
    get classes() {
      return Array.from(insertedClasses);
    },
    class(style, hxInput) {
      const hx = hxInput ?? toHash(style);
      const className = `${classPrefix}-${hx}`;
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

  singletons.set(classPrefix, api);
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
