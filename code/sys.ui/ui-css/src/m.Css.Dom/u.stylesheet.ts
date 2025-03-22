import { type t, DEFAULT, pkg, V } from './common.ts';
import { createClasses, wrangleClassPrefix } from './u.classes.ts';
import { createRules } from './u.rules.ts';
import { AlphanumericWithHyphens } from './u.ts';

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
  const cache = { classes: new Map<string, t.CssDomClasses>() };

  const api: t.CssDomStylesheet = {
    classes(prefix) {
      prefix = wrangleClassPrefix(prefix);
      if (cache.classes.has(prefix)) {
        return cache.classes.get(prefix)!;
      } else {
        const res = createClasses({ rules, prefix });
        cache.classes.set(prefix, res);
        return res;
      }
    },

    rule(selector, style) {
      return rules.add(selector, style);
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
