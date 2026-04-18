import { Path, type t } from './common.ts';
import { toViteNpmSpecifier } from './u.npm.ts';
import { resolveDeno, resolveNpmPath, resolveViteSpecifier } from './u.resolve.ts';

const depsDefault: t.PrefixDeps = {
  resolveDeno,
  resolveNpmPath,
  resolveViteSpecifier,
};

export default function prefixPlugin(cache: t.DenoCache, deps: t.PrefixDeps = depsDefault) {
  let root = Path.cwd();

  return {
    name: 'deno:prefix',
    enforce: 'pre' as const,
    configResolved(config: { root: string }) {
      root = Path.normalize(config.root);
    },
    async resolveId(
      id: string,
      importer: string | undefined,
      options: { custom?: t.Rollup.CustomPluginOptions; ssr?: boolean; isEntry: boolean },
    ) {
      if (id.startsWith('npm:')) {
        const resolved = await deps.resolveDeno(id, root);
        if (resolved === null) return;

        const actual = toViteNpmSpecifier(id);
        const result = await this.resolve(actual, importer, { ...options, skipSelf: true });
        if (result) return result;

        const fallback = await deps.resolveNpmPath(actual, root);
        return fallback ?? actual;
      }

      if (id.startsWith('http:') || id.startsWith('https:')) {
        return await deps.resolveViteSpecifier(id, cache, root, importer);
      }
    },
  } satisfies t.VitePlugin;
}
