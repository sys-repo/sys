import { type t, c, indexedMenu } from './common.ts';
import { promptAddServeLocation } from './u.prompt.ts';

export type ServeLocationsMenuPick =
  | { readonly kind: 'exit' }
  | { readonly kind: 'selected'; readonly key: string };

/**
 * Root menu for selecting (or adding) a remembered serve location.
 *
 * Owns only:
 * - selection
 * - creation (via prompt)
 * - recency updates (delegated to indexedMenu)
 */
export async function serveLocationsMenu(args: {
  cwd: t.StringDir;
  config: t.ServeTool.Config.File;
}): Promise<ServeLocationsMenuPick> {
  const { cwd, config } = args;

  return await indexedMenu({
    scope: 'serve',
    config,
    adapter: {
      list: (doc) => doc.dirs ?? [],
      set: (doc, _scope, next) => (doc.dirs = [...next]),
      keyOf: (e) => e.dir,
      lastUsedAtOf: (e) => e.lastUsedAt,
      withLastUsedAt: (e, ts) => ({ ...e, lastUsedAt: ts }),
      labelOf(e) {
        const shown = e.dir.startsWith('/') ? e.dir : e.dir === '.' ? './' : `./${e.dir}`;
        return [e.name, shown] as const;
      },
      async add() {
        await promptAddServeLocation(cwd);
      },
    },
    ui: {
      message: 'Tools:\n',
      prefix: 'serve:',
      addLabel: '   add: <dir>',
      paintKey: c.cyan,
    },
  });
}
