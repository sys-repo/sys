import { c, Fs, type t } from './common.ts';

export const listen = async (path: t.StringPath, options: t.VaultDirListenOptions = {}) => {
  const { log } = options;
  if (log) console.info(c.gray(`${c.green('listening')}: ${path}`));

  const watcher = await Fs.watch(path);
  if (log) {
    watcher.$.subscribe((e) => {
      const color = wrangle.eventColor(e.kind);
      console.info(`⚡️${color(e.kind)}:`, e.paths);
    });
  }

  return watcher;
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
