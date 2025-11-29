import { type t, Str, Is, Yaml, Obj, c, Cli, Cmd, Crdt, D, Time } from './common.ts';
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

  const Qi = '21JvXzARPYFXDVMag3x4UhLgHcQi';
  const Gf = '28k1CyQUNXnx74LhBoyvP2kif4GF';
  const dryRun = false;
  // const res = await swapoutRef({ cmd, doc, from: Qi, to: Gf, dryRun });
  // const res = await swapoutRef({ cmd, doc, from: Gf, to: Qi, dryRun });
  // console.log('res', res);

  // const res = await normalizeAliases(cmd, doc);
  // console.log('res', res);
  console.log(`-------------------------------------------`);

  //
}
