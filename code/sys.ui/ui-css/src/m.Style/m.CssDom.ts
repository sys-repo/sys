import { type t, DEFAULTS, pkg, toHash, V } from './common.ts';
import { toString } from './u.toString.ts';

let _singletonSheet: CSSStyleSheet | null = null;
const singletons = new Map<string, t.CssDom>();

export const CssDom: t.CssDomLib = {
  create(prefix) {
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
      insert(style, hxInput) {
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
  },
};

/**
 * Helpers
 */
const AlphanumericWithHyphens = V.pipe(
  V.string(),
  V.regex(
    /^[A-Za-z][A-Za-z0-9-]*$/,
    'String must start with a letter and can contain letters, digits, and hyphens (hyphen not allowed at the beginning)',
  ),
);

/**
 * Singleton <style> element management.
 * If one doesn't exist, we create one and append it to the <head>.
 */
function getStyleSheet(): CSSStyleSheet {
  if (_singletonSheet) return _singletonSheet;

  const el = document.createElement('style');
  el.setAttribute('data-controller', pkg.name);

  document.head.appendChild(el);
  _singletonSheet = el.sheet as CSSStyleSheet;
  return _singletonSheet;
}
