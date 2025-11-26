import { type t, c, Cli, Cmd, Crdt, D } from './common.ts';

type Todo = { todo: string; comment?: string };
type TRef = { doc: t.Crdt.Ref; depth: number; backRefs: number; todos?: Todo[] };

export async function tmp(dir: t.StringDir, id: t.Crdt.Id) {
  const port = D.port;
  // const PORT = 49494;

  /**
   * Retrieve the repo.
  //  */
  // await main(port, id);
  console.log('🐷', dir, id);
}
