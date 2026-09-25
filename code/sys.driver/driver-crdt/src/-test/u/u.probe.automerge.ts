import { Json } from '../common.ts';

// A fresh process has no native module cache inherited from the test runner.
const { getActorId, isWasmInitialized } = await import('@automerge/automerge');
const wasmAfterImport = isWasmInitialized();
const { automergePair } = await import('../-fixtures/u.automerge.ts');
using pair = automergePair();
console.info(Json.stringify({
  engine: 'automerge',
  pid: Deno.pid,
  wasmAfterImport,
  wasmAfterFirstUse: isWasmInitialized(),
  value: pair.owner,
  writers: [getActorId(pair.owner), getActorId(pair.peer)],
}));
