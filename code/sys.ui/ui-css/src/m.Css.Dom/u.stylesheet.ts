import { type t, DEFAULT, isRecord, pkg, V } from './common.ts';
import { createClasses, wrangleClassPrefix } from './u.classes.ts';
import { createRules } from './u.rules.ts';
import { AlphanumericWithHyphens, toString } from './u.ts';

type Prefix = string;
const singletons = new Map<Prefix, t.CssDomStylesheet>();
let _sheet: CSSStyleSheet | null = null;

/**
 * Generator factory
 */
export const create: t.CssDomLib['stylesheet'] = (options = {}) => {
  const classPrefix = ((options.classPrefix ?? '').trim() || DEFAULT.classPrefix).replace(
    /-*$/,
    '',
  );
  V.parse(AlphanumericWithHyphens, classPrefix);
  if (singletons.has(classPrefix)) return singletons.get(classPrefix)!;

  const sheet = getOrCreateCSSStyleSheet();
  const rules = createRules({ sheet });

  const classes = new Map<string, t.CssDomClasses>();

  // const insertedClasses = new Set<string>();
  const insertedRules = new Set<string>();
  const insertRule = (rule: string) => {
    if (insertedRules.has(rule)) return;
    sheet.insertRule?.(rule, sheet.cssRules.length);
    insertedRules.add(rule);
  };

  const api: t.CssDomStylesheet = {
    classes(prefix) {
      prefix = wrangleClassPrefix(prefix);
      if (classes.has(prefix)) {
        return classes.get(prefix)!;
      } else {
        const res = createClasses({ rules, prefix });
        classes.set(prefix, res);
        return res;
      }
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
