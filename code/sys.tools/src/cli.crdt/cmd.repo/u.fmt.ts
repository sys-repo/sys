import { type t, Str, c, Cli } from '../common.ts';
import { Fmt as Base } from '../u.fmt.ts';

const Tree = Base.Tree;

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

      const t = true;
      const f = false;

      const str = Str.builder()
        //
        .line()
        .line(String(table))
        .line(c.gray(`     ${br(f)} identity: ${id}`))
        .line(c.gray(`     ${br(t)} port:     ${port}`));

      str
        //
        .line()
        .line()
        .line(c.gray(`(Ctrl-C to exit)`));

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
