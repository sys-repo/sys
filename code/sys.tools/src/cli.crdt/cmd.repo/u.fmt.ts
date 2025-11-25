import { type t, Fs, Str, c, Cli } from '../common.ts';
import { Fmt as Base } from '../u.fmt.ts';

const Tree = Base.Tree;
const y = true;
const n = false;

export const Fmt = {
  ...Base,
  Repo: {
    screen(args: {
      repo: t.Crdt.Repo;
      port: number;
      alive: boolean;
      events: readonly t.CrdtRepoLogEntry[];
    }) {
      const { repo, alive, events } = args;
      const br = Tree.branch;

      const table = Cli.table([]);
      const bullet = statusBullet(!alive);
      const title = statusColor(!alive)(`   ${bullet} Repository`);
      const port = alive ? c.cyan(String(args.port)) : args.port;

      table.push([title]);

      let id = repo.id.instance;
      if (repo.id.peer) id += `; ${repo.id.peer}`;

      const urls = repo.sync.urls;
      const has = { network: urls.length > 0, storage: repo.stores.length > 0 };

      const str = Str.builder()
        .line()
        .line(String(table))
        .line(c.gray(`     ${br(false)} port:     ${port}`))
        .line(c.gray(`     ${br(false)} identity: ${id}`));

      if (!has.network) {
        str.line(c.gray(`     ${br(false)} network:  ${c.dim('(none)')}`));
      } else {
        repo.sync.urls.forEach((url) => {
          str.line(c.gray(`     ${br(false)} network:  ${url}`));
        });
      }

      if (!has.storage) {
        str.line(c.gray(`     ${br(false)} storage:  ${c.dim('(none)')}`));
      } else {
        repo.stores.forEach((e, i, total) => {
          let value = '';
          if (e.kind === 'fs') value = `${Fs.trimCwd(e.dir)}/`;
          if (e.kind === 'indexed-db') value = `${e.database} / ${e.store}`;
          str.line(c.gray(`     ${br([i, total])} storage:  ${value}`));
        });
      }

      return String(str);
    },
  },
} as const;

/**
 * Helpers:
 */
function statusBullet(stalled: boolean) {
  const color = statusColor(stalled);
  return stalled ? color('○') : color('●');
}

function statusColor(stalled: boolean) {
  return stalled ? c.yellow : c.green;
}
