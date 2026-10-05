import { Json } from '../common.ts';

const { yjsPair, projectYjs } = await import('../-fixtures/u.yjs.ts');
using pair = yjsPair();
console.info(Json.stringify({
  engine: 'yjs',
  pid: Deno.pid,
  // Yjs exposes no equivalent public global initialization-state query.
  initialization: 'module evaluated; first document pair created',
  value: projectYjs(pair.owner),
  writers: [pair.owner.clientID, pair.peer.clientID],
}));
