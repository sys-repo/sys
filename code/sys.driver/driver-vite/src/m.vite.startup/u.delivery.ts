import { Perf } from '../common/u.perf.ts';
import { CompositeHash, Fs, Is, Json, Path, type t } from './common.ts';
import { MODULE_SYNC_ENABLED } from './u.internal.ts';

type O = Record<string, unknown>;

const DELIVERY_VERSION = 'vite.startup.delivery.v2';
const MODULE_SYNC_SOURCE = 'export default false;\n';
const MODULE_SYNC_FILENAME = '.vite.bootstrap.module-sync-enabled.mjs';

/**
 * Create invocation-owned startup files.
 * The caller must await `cleanup()` when those files are no longer needed.
 */
export async function createDelivery(
  args: t.ViteStartup.Delivery.Args,
): Promise<t.ViteStartup.Handle> {
  const authority = args.authority;
  const end = Perf.section('startup.delivery', {
    dir: authority.dir,
    imports: Object.keys(authority.imports).length,
  }, { level: 2 });
  const parent = await delivery.dir(authority.dir);
  await Fs.ensureDir(parent);
  const { absolute: dir } = await Fs.makeTempDir({ dir: parent, prefix: 'delivery.' });
  let transferred = false;
  await using _setup = {
    async [Symbol.asyncDispose]() {
      if (!transferred) await Fs.remove(dir, { log: false });
    },
  };

  const moduleSyncPath = Path.join(dir, MODULE_SYNC_FILENAME);
  await Fs.write(moduleSyncPath, MODULE_SYNC_SOURCE, { throw: true });

  const imports = delivery.sortImports({
    ...authority.imports,
    [MODULE_SYNC_ENABLED]: Path.toFileUrl(moduleSyncPath).href,
  });
  const json = delivery.importMap({ imports, scopes: authority.scopes }, authority.dir, dir);
  // Identity describes authority and shim bytes, not invocation-owned transport paths.
  const digest = delivery.identity({ ...authority, moduleSync: MODULE_SYNC_SOURCE });
  const path = Path.join(dir, `.vite.bootstrap.${digest}.imports.json`);
  await Fs.write(path, `${Json.stringify(json, 2)}\n`, { throw: true });

  const handle = {
    path,
    async cleanup() {
      await Fs.remove(dir, { log: false });
    },
  };
  end({ path, digest, deliveryDir: dir });
  transferred = true;
  return handle;
}

/**
 * Helpers:
 */
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
  importMap(
    value: { imports: t.ViteStartup.Imports; scopes?: t.ViteStartup.Scopes },
    authorityDir: string,
    deliveryDir: string,
  ) {
    const imports = delivery.rebaseSpecifierRecord(value.imports, authorityDir, deliveryDir) ?? {};
    const scopes = delivery.rebaseScopes(value.scopes, authorityDir, deliveryDir);
    return {
      imports,
      ...(scopes ? { scopes } : {}),
    };
  },

  rebaseScopes(value: unknown, authorityDir: string, deliveryDir: string) {
    if (!Is.record<O>(value)) return undefined;
    return Object.fromEntries(
      Object.entries(value).map(([scope, imports]) => [
        delivery.rebaseScope(scope, authorityDir, deliveryDir),
        delivery.rebaseSpecifierRecord(imports, authorityDir, deliveryDir) ?? {},
      ]),
    );
  },

  rebaseSpecifierRecord(value: unknown, authorityDir: string, deliveryDir: string) {
    if (!Is.record<O>(value)) return undefined;
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
    if (Is.array(value)) return value.map((entry) => delivery.canonical(entry));
    if (Is.record(value)) {
      return Object.fromEntries(
        Object.entries(value)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, entry]) => [key, delivery.canonical(entry)]),
      );
    }
    return value;
  },

  sortImports(imports: t.ViteStartup.Imports) {
    return Object.fromEntries(Object.entries(imports).sort(([a], [b]) => a.localeCompare(b)));
  },
} as const;
