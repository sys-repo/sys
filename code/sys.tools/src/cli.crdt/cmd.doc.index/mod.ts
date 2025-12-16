/**
 * @module
 * Indexing utilities where a CRDT acts as the index of record.
 */
import { RepoProcess } from '../cmd.repo.daemon/mod.ts';
import { type t, D } from '../common.ts';

export async function indexDir(
  cwd: t.StringDir,
  docid: t.Crdt.Id,
  path: t.ObjectPath = ['fs:index:dir'],
) {
  const port = D.port.repo;
  const cmd = await RepoProcess.tryClient(port);
  if (!cmd) return;


    `);
}
