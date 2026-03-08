import { Path, type t } from './common.ts';
import { toViteNpmSpecifier } from './u.npm.ts';
import { resolveDeno, resolveViteSpecifier } from './u.resolve.ts';

const depsDefault: t.PrefixDeps = {
  resolveDeno,
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
      this: { resolve: (id: string) => Promise<unknown> },
      id: string,
      importer?: string,
    ) {
      if (id.startsWith('npm:')) {
        const resolved = await deps.resolveDeno(id, root);
        if (resolved === null) return;

        const actual = toViteNpmSpecifier(`npm:${resolved.id}`);
        const result = await this.resolve(actual);
        return result ?? actual;
      }

      if (id.startsWith('http:') || id.startsWith('https:')) {
        return await deps.resolveViteSpecifier(id, cache, root, importer);
      }
    },
  };
}
