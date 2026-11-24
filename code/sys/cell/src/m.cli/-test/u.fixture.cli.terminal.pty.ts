import { spawn } from 'node:child_process';
import { expect, Fs, Str, Testing, Time } from '../../-test.ts';
import { Cli, Json } from '../common.ts';
import { CellSession } from '../u/u.session.ts';
import { sessionRoot } from './u.fixture.kill.ts';
import { killOwnedGroup, stty } from './u.fixture.cli.vite.ts';

// Real entrypoints and animated terminal hooks, with service completion controlled by files.
expect(Cli.Is.interactive()).to.eql(true);
await stty(['cols', '100', 'rows', '30']);
const before = await stty(['-g']);
const [entry, mode] = Deno.args;
const fixture = await Testing.dir('CellCli.terminal.cell');
const root = await sessionRoot(fixture.dir);
const runtime = Deno.env.get(CellSession.D.env)!;
const service = Fs.join(Fs.cwd(), 'src/m.cli/-test/u.fixture.cli.terminal.service.ts');
await Fs.copyFile(service, Fs.join(root, '-services/terminal.ts'), { throw: true });
await Fs.write(
  Fs.join(root, '-config/@sys.cell/cell.yaml'),
  Str.dedent(`
  kind: cell
  version: 1
  services:
    - name: terminal
      use: TerminalService
      from: ./-services/terminal.ts
      config: ./-config/terminal.yaml
`).trimStart(),
);
const path = entry === 'cli'
  ? './src/m.cli/mod.ts'
  : entry === 'root'
  ? './src/mod.ts'
  : './-scripts/task.cli.ts';
const env: Record<string, string> = {
  ...Deno.env.toObject(),
  CELL_PTY_CONTROL: root,
  CELL_PTY_MODE: mode,
};
delete env.CI;
const child = spawn(Deno.execPath(), ['run', '-P=cli', path, 'start', root], {
  cwd: Fs.cwd(),
  env,
  detached: true,
  stdio: 'inherit',
});
let status: { code: number | null; signal: string | null } | undefined;
let failure: Error | undefined;
child.on('error', (error) => (failure = error));
child.once('close', (code, signal) => (status = { code, signal }));
if (child.pid) console.info(`PTY_OWNER:${child.pid}`);

try {
  await Time.waitFor(async () => {
    checkAlive();
    return await Fs.exists(Fs.join(root, 'port'));
  }, { interval: 20, timeout: 15_000 });
  const port = Number((await Fs.readText(Fs.join(root, 'port'))).data);
  const response = await fetch(`http://127.0.0.1:${port}`, { signal: AbortSignal.timeout(2_000) });
  expect(await response.text()).to.eql('terminal-proof');
  await Fs.write(Fs.join(root, 'start'), 'start');
  if (mode !== 'startup-failure') {
    await Time.waitFor(async () => {
      checkAlive();
      return (await CellSession.list(root, { dir: runtime })).some((s) => s.state === 'ready') &&
        (await stty(['-g'])) !== before;
    }, { interval: 20, timeout: 5_000 });
    await Fs.write(Fs.join(root, 'finish'), 'finish');
  }
  const exited = await Time.waitFor(() => status, { interval: 20, timeout: 10_000 });
  expect(failure).to.eql(undefined);
  expect(await Fs.exists(Fs.join(root, 'closed'))).to.eql(true);
  expect(await CellSession.list(root, { dir: runtime })).to.eql([]);
  expect(await stty(['-g'])).to.eql(before);
  const listener = Deno.listen({ hostname: '127.0.0.1', port });
  listener.close();
  console.info('PTY_CLEAN');
  expect(exited).to.eql({ code: mode === 'success' ? 0 : 1, signal: null });
  console.info('PTY_STATUS_OK');
} finally {
  // Only this invocation's child group; all success assertions precede fallback cleanup.
  if (child.pid) killOwnedGroup(child.pid);
  await Time.waitFor(() => status, { interval: 20, timeout: 5_000 });
  await stty([before]);
}

function checkAlive() {
  if (failure) throw failure;
  if (status) throw new Error(`Terminal child exited before handshake: ${Json.stringify(status)}`);
}
