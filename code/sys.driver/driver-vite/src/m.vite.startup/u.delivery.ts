import { CompositeHash, Fs, Is, Json, Path, type t } from './common.ts';
import { AUTHORITY_JSON, MODULE_SYNC_ENABLED, type AuthorityState } from './u.internal.ts';

const DELIVERY_VERSION = 'vite.startup.delivery.v1';
const MODULE_SYNC_SOURCE = 'export default false;\n';
const MODULE_SYNC_FILENAME = '.vite.bootstrap.module-sync-enabled.mjs';

export async function createDelivery(
  args: t.ViteStartup.Delivery.Args,
): Promise<t.ViteStartup.Handle> {
  const authority = args.authority as AuthorityState;
  const dir = await delivery.dir(authority.dir);
  await Fs.ensureDir(dir);

  const moduleSyncPath = Path.join(dir, MODULE_SYNC_FILENAME);
  if (!(await Fs.exists(moduleSyncPath))) {
    await Fs.write(moduleSyncPath, MODULE_SYNC_SOURCE);
  }

  const imports = delivery.sortImports({
    ...authority.imports,
    [MODULE_SYNC_ENABLED]: Path.toFileUrl(moduleSyncPath).href,
  });
  const json = delivery.importMap({ ...(authority[AUTHORITY_JSON] ?? {}), imports }, authority.dir, dir);
  const digest = delivery.identity(json);
  const path = Path.join(dir, `.vite.bootstrap.${digest}.imports.json`);
  await Fs.write(path, `${Json.stringify(json, 2)}\n`);

  return {
    path,
    cleanup: async () => {
      if (await Fs.exists(path)) await Fs.remove(path, { log: false });
      if (await Fs.exists(moduleSyncPath)) await Fs.remove(moduleSyncPath, { log: false });
    },
  };
}

const delivery = {
  async dir(authorityDir: string) {
    const anchor = await delivery.packageAnchor(authorityDir);
    return Path.join(Path.dirname(anchor), 'node_modules', '.vite', '.sys-driver-vite', 'startup');
  },

  identity(value: unknown) {
    return CompositeHash.builder()
      .add('version', DELIVERY_VERSION)
      .add('payload', Json.stringify(delivery.canonical(value), 0))
      .digest;
  },

  // Delivery owns rebasing because moving the import-map changes the base used for
  // relative imports and scopes. Projection still owns authority truth. Keep this
  // logic transport-only; do not use it to change payload breadth or authority ranking.
  importMap(value: Record<string, unknown>, authorityDir: string, deliveryDir: string) {
    const imports = delivery.rebaseSpecifierRecord(value.imports, authorityDir, deliveryDir);
    const scopes = delivery.rebaseScopes(value.scopes, authorityDir, deliveryDir);
    return {
      ...value,
      ...(imports ? { imports } : {}),
      ...(scopes ? { scopes } : {}),
    };
  },

  rebaseScopes(value: unknown, authorityDir: string, deliveryDir: string) {
    if (!Is.record<Record<string, unknown>>(value)) return undefined;
    return Object.fromEntries(
      Object.entries(value).map(([scope, imports]) => [
        delivery.rebaseScope(scope, authorityDir, deliveryDir),
        delivery.rebaseSpecifierRecord(imports, authorityDir, deliveryDir) ?? {},
      ]),
    );
  },

  rebaseSpecifierRecord(value: unknown, authorityDir: string, deliveryDir: string) {
    if (!Is.record<Record<string, unknown>>(value)) return undefined;
    return Object.fromEntries(
      Object.entries(value).map(([key, target]) => [
        key,
        Is.str(target) ? delivery.rebaseSpecifier(target, authorityDir, deliveryDir) : target,
      ]),
    );
  },

  rebaseScope(value: string, authorityDir: string, deliveryDir: string) {
    return delivery.isRelativeLike(value)
      ? delivery.relativeFrom(deliveryDir, Path.resolve(authorityDir, value), value.endsWith('/'))
      : value;
  },

  rebaseSpecifier(value: string, authorityDir: string, deliveryDir: string) {
    return delivery.isRelativeLike(value)
      ? delivery.relativeFrom(deliveryDir, Path.resolve(authorityDir, value), value.endsWith('/'))
      : value;
  },

  relativeFrom(fromDir: string, target: string, keepTrailingSlash = false) {
    let relative = Path.relative(fromDir, target).replaceAll('\\', '/');
    if (!relative.startsWith('./') && !relative.startsWith('../')) relative = `./${relative}`;
    if (keepTrailingSlash && !relative.endsWith('/')) relative = `${relative}/`;
    return relative;
  },

  isRelativeLike(value: string) {
    return value.startsWith('./') || value.startsWith('../');
  },

  async packageAnchor(start: string) {
    let current = Path.resolve(start);

    while (true) {
      const path = Path.join(current, 'package.json');
      const stat = await Fs.stat(path);
      if (stat?.isFile) return path;

      const parent = Path.dirname(current);
      if (parent === current) return Path.join(Path.resolve(start), 'package.json');
      current = parent;
    }
  },

  canonical(value: unknown): unknown {
    if (Array.isArray(value)) return value.map((entry) => delivery.canonical(entry));
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value as Record<string, unknown>)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, entry]) => [key, delivery.canonical(entry)]),
      );
    }
    return value;
  },

  sortImports(imports: Record<string, string>) {
    return Object.fromEntries(Object.entries(imports).sort(([a], [b]) => a.localeCompare(b)));
  },
} as const;
