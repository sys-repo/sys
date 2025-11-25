import { type t, Str, c, Cli } from '../common.ts';
import { Fmt as Base } from '../u.fmt.ts';

const Tree = Base.Tree;

export const Fmt = {
  ...Base,
  Repo: {
    screen(repo: t.Crdt.Repo, alive: boolean, events: readonly t.CrdtRepoLogEntry[]) {
      const table = Cli.table([]);
      const bullet = statusBullet(!alive);
      const title = statusColor(!alive)(`   ${bullet} Repository`);
      const br = Tree.branch;

      table.push([title]);

      const str = Str.builder()
        //
        .line()
        .line(String(table))
        .line(c.gray(`     ${br(false)} id:   ${repo.id.instance}`))
        .line(c.gray(`     ${br(true)} peer: ${repo.id.peer ?? '-'}`));

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
