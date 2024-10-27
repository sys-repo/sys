import { c, Fs, type t } from './common.ts';

export const Vault: t.VaultLib = {
  async dir(path: t.StringPath) {
    const exists = await Fs.exists(path);
    const api: t.VaultDir = {
      path,
      exists,
      async listen() {
        console.info(c.gray(`${c.green('listening')}: ${path}`));
        if (!exists) {
          console.warn(`Cannon listen to vault, directory does not exist: ${path}`);
          return;
        }
        const watcher = Deno.watchFs(path);
        for await (const e of watcher) {
          console.info(`💦 ${c.cyan(e.kind)}:`, e.paths);
        }
      },
    };
    return api;
  },
};
