import { DistServer } from '@sys/server/dist/server';
import { Args, Fs, Process } from './common.ts';
import { Json, type t } from '../common.ts';

// Host argv and stdin form this fixture's process protocol; `@sys/process` deliberately exposes
// neither as borrowed host capabilities.
const argv = Args.parse(Deno.args, { stopEarly: true })._;
if (argv.length !== 1) throw new Error('Expected one exact local Dist root.');

const root = Fs.resolve(argv[0]);
let ancestorDenied = false;
try {
  await Fs.lstat(Fs.dirname(root));
} catch (cause) {
  // The exact host permission error is the evidence under test, not application error handling.
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
  Process.stdout.write(`LOCAL_DIST_PROOF ${
    Json.stringify({
      origin: server.origin,
      port: server.port,
      ancestorDenied,
    }, 0)
  }\n`);
  await Deno.stdin.readable.pipeTo(new WritableStream());
} finally {
  await server.close('proof.complete');
}
