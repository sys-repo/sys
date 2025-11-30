import { type t, Str, Is, Yaml, Fs, Obj, c, Cli, Cmd, Crdt, D, Time } from './common.ts';
import { RepoProcess } from './cmd.daemon.repo/mod.ts';

// import { swapoutRef } from './u.patch/u.swapoutRef.ts';
// import { normalizeAliases } from './u.patch/u.normalizeAliases.ts';
// import { AliasResolver } from '@sys/std/alias';

type O = Record<string, unknown>;
type Client = t.Crdt.Cmd.Client;

export async function tmp(dir: t.StringDir, doc: t.Crdt.Id) {
  const port = D.port.repo;
  const cmd = await RepoProcess.tryClient(port);
  if (!cmd) return;

  console.log(`-------------------------------------------`);
  console.info(Fs.trimCwd(import.meta.filename ?? ''));
}
