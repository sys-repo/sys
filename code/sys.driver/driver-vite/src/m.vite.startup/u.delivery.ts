import { Fs, Path, type t } from './common.ts';
import { AUTHORITY_JSON, MODULE_SYNC_ENABLED, type AuthorityState } from './u.internal.ts';

export async function createDelivery(
  args: t.ViteStartup.Delivery.Args,
): Promise<t.ViteStartup.Handle> {
  const authority = args.authority as AuthorityState;

  // Phase .01 preserves the current startup delivery mechanics for behavior stability.
  // This is isolated delivery debt and will be replaced by later stable-identity work.
  const moduleSyncPath = Path.join(
    authority.dir,
    `.vite.bootstrap.${crypto.randomUUID()}.module-sync-enabled.mjs`,
  );
  await Deno.writeTextFile(moduleSyncPath, 'export default false;\n');

  const imports = delivery.sortImports({
    ...authority.imports,
    [MODULE_SYNC_ENABLED]: Path.toFileUrl(moduleSyncPath).href,
  });
  const path = Path.join(authority.dir, `.vite.bootstrap.${crypto.randomUUID()}.imports.json`);
  await Fs.writeJson(path, { ...(authority[AUTHORITY_JSON] ?? {}), imports });

  return {
    path,
    cleanup: async () => {
      if (await Fs.exists(path)) await Fs.remove(path, { log: false });
      if (await Fs.exists(moduleSyncPath)) await Fs.remove(moduleSyncPath, { log: false });
    },
  };
}

const delivery = {
  sortImports(imports: Record<string, string>) {
    return Object.fromEntries(Object.entries(imports).sort(([a], [b]) => a.localeCompare(b)));
  },
} as const;
