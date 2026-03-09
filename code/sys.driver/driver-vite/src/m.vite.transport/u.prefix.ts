import { createRequire } from 'node:module';
import { Path, type t } from './common.ts';
import { toViteNpmSpecifier } from './u.npm.ts';
import { resolveDeno, resolveViteSpecifier } from './u.resolve.ts';

const depsDefault: t.PrefixDeps = {
  resolveDeno,
  resolveViteSpecifier,
};

export default function prefixPlugin(cache: t.DenoCache, deps: t.PrefixDeps = depsDefault) {
  let root = Path.cwd();
  let packagePath = '';

  return {
    name: 'deno:prefix',
    enforce: 'pre' as const,
    async configResolved(config: { root: string }) {
      root = Path.normalize(config.root);
      packagePath = await wrangle.packagePath(root);
    },
    async resolveId(
      this: {
        resolve: (
          id: string,
          importer?: string,
          options?: { readonly skipSelf?: boolean },
        ) => Promise<unknown>;
      },
      id: string,
      importer?: string,
    ) {
      if (id.startsWith('npm:')) {
        const resolved = await deps.resolveDeno(id, root);
        if (resolved === null) return;

        const actual = toViteNpmSpecifier(id);
        const direct = wrangle.resolvePackage(actual, packagePath);
        if (direct) return direct;
        const result = await this.resolve(actual, packagePath, { skipSelf: true });
        return result ?? actual;
      }

      if (id.startsWith('http:') || id.startsWith('https:')) {
        return await deps.resolveViteSpecifier(id, cache, root, importer);
      }
    },
  };
}

const wrangle = {
  async packagePath(start: string) {
    let current = Path.resolve(start);

    while (true) {
      const path = Path.join(current, 'package.json');
      if (
        await Deno.stat(path)
          .then(() => true)
          .catch(() => false)
      )
        return path;
      const parent = Path.dirname(current);
      if (parent === current) return '';
      current = parent;
    }
  },

  resolvePackage(id: string, packagePath: string) {
    if (!packagePath) return '';

    try {
      const require = createRequire(packagePath);
      return require.resolve(id);
    } catch {
      return '';
    }
  },
} as const;
