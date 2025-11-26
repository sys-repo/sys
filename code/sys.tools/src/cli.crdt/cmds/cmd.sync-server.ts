import { type t, c, Cli, Crdt, D, Str } from '../common.ts';
import { Fmt } from '../u.fmt.ts';
import { RepoProcess } from '../u.repo/mod.ts';

type Client = t.Crdt.Cmd.Client;

const Tree = Cli.Fmt.Tree;

export async function startSyncServer(dir: t.StringDir) {
  const cmd = await RepoProcess.tryClient(D.port);
  if (!cmd) return;


  return;
}
