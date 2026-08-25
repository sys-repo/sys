import { DistServer } from '@sys/server/dist/server';
import { Json, Path, type t } from '../common.ts';

const [dir] = Deno.args;
if (!dir) throw new Error('Expected one exact local Dist root.');

const root = Path.resolve(dir);
let ancestorDenied = false;
try {
  await Deno.lstat(Path.dirname(root));
} catch (cause) {
  if (!(cause instanceof Deno.errors.NotCapable)) {
    throw new Error('Unexpected ancestor-read failure.', { cause });
  }
  ancestorDenied = true;
}
if (!ancestorDenied) throw new Error('Ancestor read was not denied.');

const limits = Object.freeze({
  manifestBytes: 1024 * 1024,
  entries: 100,
  fileBytes: 1024 * 1024,
  totalBytes: 4 * 1024 * 1024,
});

const server = await DistServer.Local.start({
  dir: root as t.StringDir,
  limits,
  hostname: '127.0.0.1',
  port: 0,
  silent: true,
  keyboard: false,
});

try {
  console.info(`LOCAL_DIST_PROOF ${
    Json.stringify({
      origin: server.origin,
      port: server.port,
      ancestorDenied,
    }, 0)
  }`);
  await Deno.stdin.readable.pipeTo(new WritableStream());
} finally {
  await server.close('proof.complete');
}
