import { Path, type t } from './common.ts';
import { resolveDeno, resolveViteSpecifier } from './u.resolve.ts';

export default function prefixPlugin(cache: t.DenoCache) {
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
        const resolved = await resolveDeno(id, root);
        if (resolved === null) return;

        const actual = resolved.id.slice(0, resolved.id.indexOf('@'));
        const result = await this.resolve(actual);
        return result ?? actual;
      }

      if (id.startsWith('http:') || id.startsWith('https:')) {
        return await resolveViteSpecifier(id, cache, root, importer);
      }
    },
  };
}
