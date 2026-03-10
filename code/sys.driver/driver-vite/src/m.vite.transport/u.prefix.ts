import type { PluginContext, ResolveIdResult } from 'rollup';
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
      this: PluginContext,
      id: string,
      importer?: string,
      _options?: {
        attributes: Record<string, string>;
        custom?: unknown;
        ssr?: boolean;
        isEntry: boolean;
      },
    ): Promise<ResolveIdResult> {
      if (id.startsWith('npm:')) {
        const resolved = await deps.resolveDeno(id, root);
        if (resolved === null) return;

        const actual = toViteNpmSpecifier(id);
        const result = await this.resolve(actual, importer, { skipSelf: true });
        return result ?? actual;
      }

      if (id.startsWith('http:') || id.startsWith('https:')) {
        return await deps.resolveViteSpecifier(id, cache, root, importer);
      }
    },
  } satisfies t.VitePlugin;
}
