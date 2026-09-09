import { type t } from './common.ts';
import { DEFAULT_PACKAGE_RULES } from './u.rules.ts';
import { rewriteImports } from './u.rewrite.ts';

/** Create the controlled optimize-imports Vite plugin. */
function plugin(options: t.OptimizeImportsPlugin.OptionsInput = {}): t.VitePlugin {
  const rules = options.packages ?? DEFAULT_PACKAGE_RULES;

  return {
    name: 'sys:optimize-imports',
    enforce: 'pre',
    transform(code, id) {
      if (!shouldTransform(code, id)) return null;
      const result = rewriteImports(code, rules);
      if (!result.changed) return null;
      return { code: result.code, map: null };
    },
  };
}

export const OptimizeImportsPlugin: t.OptimizeImportsPlugin.Lib = {
  plugin,
};

/**
 * Helpers:
 */
function shouldTransform(code: string, id: string) {
  if (!code.includes('@sys/')) return false;
  if (id.includes('/node_modules/')) return false;
  return /\.(?:[cm]?[jt]sx?|vue|svelte)(?:\?|$)/.test(id);
}
