import { type t } from './common.ts';
import { createClasses, wrangleClassPrefix } from './u.classes.ts';
import { createContainer } from './u.ctx.container.ts';
import { createRules } from './u.rules.ts';
import { getStylesheetId } from './u.ts';

const singletons = new Map<t.StringId, t.CssDomStylesheet>();

/**
 * Generator factory
 */
export const create: t.CssDomLib['stylesheet'] = (input) => {
  const options = wrangle.options(input);
  const id = getStylesheetId(options.instance, options.classPrefix);
  if (singletons.has(id)) return singletons.get(id)!;

  const sheet = getOrCreateDomStyleSheet(id);
  const rules = createRules({ sheet });
  const cache = {
    classes: new Map<string, t.CssDomClasses>(),
    getOrCreate<T>(key: string, map: Map<string, T>, factory: () => T): T {
      if (!map.has(key)) map.set(key, factory());
      return map.get(key)!;
    },
  };

  const api: t.CssDomStylesheet = {
    id,
    rules,
    rule(selector, style, options) {
      return rules.add(selector, style, options);
    },
    classes(prefix) {
      const key = wrangleClassPrefix(prefix, options.classPrefix);
      prefix = prefix ?? options.classPrefix;
      return cache.getOrCreate(key, cache.classes, () => createClasses({ rules, prefix }));
    },
    container(...args: any[]) {
      const { name, condition } = wrangle.containerArgs(args);
      return createContainer({ rules, condition, name });
    },
  };

  singletons.set(id, api);
  return api;
};

/**
 * Helpers:
 */
const wrangle = {
  options(input: Parameters<t.CssDomLib['stylesheet']>[0]): t.CssDomStylesheetOptions {
    if (!input) return {};
    if (typeof input === 'string') return { instance: input };
    return input;
  },

  containerArgs(args: any[]) {
    const done = (condition: string, name?: string) => {
      name = name ? name.trim() : name;
      condition = condition ? condition.trim() : '';
      return { name, condition };
    };
    if (!args || args.length === 0) return done('');
    if (args.length === 1) return done(args[0]);
    return done(args[1], args[0]);
  },
} as const;

/**
 * Singleton <style> element management.
 * If one doesn't exist, we create one and append it to the <head>.
 */
function getOrCreateDomStyleSheet(id: string): CSSStyleSheet {
  if (typeof document === 'undefined') {
    return {} as CSSStyleSheet; // Dummy (safe on server).
  } else {
    const el = document.createElement('style');
    el.setAttribute('data-controller', id);
    document.head.appendChild(el);
    return el.sheet as CSSStyleSheet;
  }
}
