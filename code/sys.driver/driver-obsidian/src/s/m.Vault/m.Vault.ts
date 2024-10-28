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
          console.warn(`Cannot listen to vault, directory does not exist: ${path}`);
          return;
        }
        const watcher = Deno.watchFs(path);
        for await (const e of watcher) {
          const kind = wrangle.eventColor(e.kind);
          console.info(`${kind}:`, e.paths);
        }
      },
    };
    return api;
  },
};

/**
 * Helpers
 */
const wrangle = {
  eventColor(kind: Deno.FsEvent['kind']) {
    let color = c.cyan;
    if (kind === 'rename') color = c.yellow;
    return color;
  },
} as const;
