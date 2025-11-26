import { type t, c, Cli, Cmd, Crdt, D } from './common.ts';
import { RepoProcess } from './u.repo/mod.ts';
import { Fmt } from './u.fmt.ts';

type Todo = { todo: string; comment?: string };
type TRef = { doc: t.Crdt.Ref; depth: number; backRefs: number; todos?: Todo[] };

export async function tmp(dir: t.StringDir, doc: t.Crdt.Id) {
  const port = D.port;

  const cmd = await RepoProcess.tryClient(D.port);
  if (!cmd) return;

  console.info('cmd(rpc):', cmd, '\n');

  /**
   * Retrieve the repo.
  //  */
  // await main(port, id);
  console.info(Fmt.prettyUri(doc));
  console.info('🐷', dir);
}
