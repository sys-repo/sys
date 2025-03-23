import { type t, DEFAULT } from './common.ts';
import { createClasses, wrangleClassPrefix } from './u.classes.ts';
import { createRules } from './u.rules.ts';
import { getStylesheetId } from './u.ts';

const singletons = new Map<t.StringId, t.CssDomStylesheet>();

/**
 * Generator factory
 */
export const create: t.CssDomLib['stylesheet'] = (options = {}) => {
  const id = getStylesheetId(options.instance);
  if (singletons.has(id)) return singletons.get(id)!;

  const sheet = getOrCreateCSSStyleSheet(id);
  const rules = createRules({ sheet });
  const cache = { classes: new Map<string, t.CssDomClasses>() };

  const api: t.CssDomStylesheet = {
    id,

    classes(prefix) {
      const key = wrangleClassPrefix(prefix);
      if (cache.classes.has(key)) {
        return cache.classes.get(key)!;
      } else {
        const res = createClasses({ rules, prefix });
        cache.classes.set(res.prefix, res);
        return res;
      }
    },

    rule(selector, style) {
      return rules.add(selector, style);
    },
  };

  singletons.set(id, api);
  return api;
};

/**
 * Helpers
 */

/**
 * Singleton <style> element management.
 * If one doesn't exist, we create one and append it to the <head>.
 */
function getOrCreateCSSStyleSheet(id: string): CSSStyleSheet {
  if (typeof document === 'undefined') {
    return {} as CSSStyleSheet; // Dummy (safe on server).
  } else {
    const el = document.createElement('style');
    el.setAttribute('data-controller', id);
    document.head.appendChild(el);
    return el.sheet as CSSStyleSheet;
  }
}
