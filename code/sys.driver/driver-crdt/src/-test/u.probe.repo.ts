import { Json } from './common.ts';
import { repoImportControl } from './-fixtures/u.repo.ts';

console.info(Json.stringify({ engine: 'repo', pid: Deno.pid, ...await repoImportControl() }));
// The harness awaits natural process exit, not just this JSON line.
