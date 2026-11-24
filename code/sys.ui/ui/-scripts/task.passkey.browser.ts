import { Process } from '@sys/process';
import { Str } from '@sys/std/str';
import { Browser, Fs, Testing } from '@sys/testing/server';

const [mode] = Deno.args;
if (Deno.args.length !== 1 || (mode !== 'serve' && mode !== 'dev')) {
  throw new Error('Start your own UI Cell, then run: deno task test:passkey:browser <serve|dev>');
}
const view = Fs.resolve(mode === 'serve' ? './dist' : './src');
const scratch = Fs.resolve('./.tmp/passkey-browser');
await Fs.ensureDir(scratch);
if (await Fs.realPath(scratch) !== scratch || await Fs.realPath(view) !== view) {
  throw new Error('Expected canonical proof and view roots.');
}
const executable = await Browser.Executable.admit(Deno.env.get('CHROME_BIN'), {
  writableRoots: [scratch],
});
const cache = Deno.env.get('DENO_DIR');
const env: Record<string, string> = cache ? { DENO_DIR: cache } : {};
const fixtures = './-sample/passkey/-test.external';
const bundle = await Process.capture({
  args: [
    'bundle',
    '--platform=browser',
    '--frozen',
    '--deny-import',
    '--node-modules-dir=manual',
    `${fixtures}/page.inspect.ts`,
  ],
  clearEnv: true,
  env,
  executionTimeout: 30_000,
  maxStdoutBytes: 2_000_000,
  maxStderrBytes: 100_000,
});
if (!bundle.success || bundle.stdoutTruncated || bundle.stderrTruncated) {
  throw new Error(`Could not bundle the inspect client: ${bundle.text.stderr.trim()}`);
}

const origin = 'http://localhost:1234';
const path = `/${crypto.randomUUID()}`;
let receipts = 0;
await using cleanup = new AsyncDisposableStack();
const server = Testing.Http.server((req) => {
  const { pathname } = new URL(req.url);
  if (req.headers.get('origin') !== origin) return new Response(null, { status: 403 });
  if (req.method === 'POST' && pathname === path) {
    receipts++;
    return new Response(null, { status: 204 });
  }
  return new Response(null, { status: 404 });
});
cleanup.defer(() => server.dispose());

const receipt = new URL(path, server.url.toURL());
const html = Str.dedent(`
  <!doctype html><link rel="icon" href="data:,">
  <form name="receipt" method="post" action="${receipt}"></form>
  <script type="module" src="data:text/javascript;base64,${bundle.stdout.toBase64()}"></script>
`);
const file = Fs.join(view, '-passkey-proof.html');
await Deno.writeTextFile(file, html, { createNew: true });
cleanup.defer(() => Deno.remove(file));

const proof = await Process.inherit({
  clearEnv: true,
  env: { ...env, TMPDIR: scratch },
  args: [
    'test',
    '--frozen',
    '--cached-only',
    '--no-prompt',
    '-P=passkey-browser',
    `--allow-read=./.tmp/passkey-browser,${executable}`,
    `--allow-run=${executable}`,
    '--trace-leaks',
    `${fixtures}/-inspect.browser.ts`,
    '--',
    executable,
  ],
});
if (!proof.success) throw new Error(`Chrome proof exited ${proof.code}.`);
if (receipts !== 1) throw new Error(`Expected one inspect receipt, got ${receipts}.`);
console.info(`${mode}: Chrome received session.inspect → accepted(null) through ${origin}.`);
