import { type t, DEFAULT } from './common.ts';
import { createClasses, wrangleClassPrefix } from './u.classes.ts';
import { createRules } from './u.rules.ts';
import { getStylesheetId } from './u.ts';
import { createContext } from './u.context.ts';

const singletons = new Map<t.StringId, t.CssDomStylesheet>();

/**
 * Generator factory
 */
export const create: t.CssDomLib['stylesheet'] = (options = {}) => {
  const id = getStylesheetId(options.instance);
  if (singletons.has(id)) return singletons.get(id)!;

  const sheet = getOrCreateCSSStyleSheet(id);
  const rules = createRules({ sheet });
  const cache = {
    classes: new Map<string, t.CssDomClasses>(),
    contexts: new Map<string, t.CssDomContextBlock>(),
    getOrCreate<T>(key: string, map: Map<string, T>, factory: () => T): T {
      if (!map.has(key)) map.set(key, factory());
      return map.get(key)!;
    },
  };

  const api: t.CssDomStylesheet = {
    id,
    rule(selector, style) {
      return rules.add(selector, style);
    },
    classes(prefix) {
      const key = wrangleClassPrefix(prefix);
      return cache.getOrCreate(key, cache.classes, () => createClasses({ rules, prefix }));
    },
    context(kind) {
      return cache.getOrCreate(kind, cache.contexts, () => createContext({ rules, kind }));
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
