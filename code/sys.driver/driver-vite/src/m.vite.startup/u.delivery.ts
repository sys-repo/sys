import { CompositeHash, Fs, Path, type t } from './common.ts';
import { AUTHORITY_JSON, MODULE_SYNC_ENABLED, type AuthorityState } from './u.internal.ts';

const DELIVERY_VERSION = 'vite.startup.delivery.v1';
const MODULE_SYNC_SOURCE = 'export default false;\n';
const MODULE_SYNC_FILENAME = '.vite.bootstrap.module-sync-enabled.mjs';

export async function createDelivery(
  args: t.ViteStartup.Delivery.Args,
): Promise<t.ViteStartup.Handle> {
  const authority = args.authority as AuthorityState;
  const moduleSyncPath = Path.join(authority.dir, MODULE_SYNC_FILENAME);
  if (!(await Fs.exists(moduleSyncPath))) {
    await Deno.writeTextFile(moduleSyncPath, MODULE_SYNC_SOURCE);
  }

  const imports = delivery.sortImports({
    ...authority.imports,
    [MODULE_SYNC_ENABLED]: Path.toFileUrl(moduleSyncPath).href,
  });
  const json = { ...(authority[AUTHORITY_JSON] ?? {}), imports };
  const digest = delivery.identity(json);
  const path = Path.join(authority.dir, `.vite.bootstrap.${digest}.imports.json`);
  await Fs.writeJson(path, json);

  return {
    path,
    cleanup: async () => {
      if (await Fs.exists(path)) await Fs.remove(path, { log: false });
      if (await Fs.exists(moduleSyncPath)) await Fs.remove(moduleSyncPath, { log: false });
    },
  };
}

const delivery = {
  identity(value: unknown) {
    return CompositeHash.builder()
      .add('version', DELIVERY_VERSION)
      .add('payload', JSON.stringify(delivery.canonical(value)))
      .digest;
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
