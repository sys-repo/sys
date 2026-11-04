import { spawn } from 'node:child_process';
import { kill } from 'node:process';
import { expect, Fs, Time } from '../../-test.ts';
import { CellSession } from '../u/u.session.ts';
import { sessionRoot } from './u.fixture.kill.ts';
import { killOwnedGroup } from './u.fixture.cli.vite.ts';

// Executed inside the OS `script` PTY. Neither the wrapper nor its trusted child is mocked.
expect(Deno.stdin.isTerminal() && Deno.stdout.isTerminal()).to.eql(true);
await stty(['cols', '100', 'rows', '30']);
const before = await stty(['-g']);
const root = await sessionRoot(Fs.resolve('./-sample/cell.vite'));
const dir = Deno.env.get(CellSession.D.env)!;
const owned = new Set<number>();
const forced = Deno.args[0] === 'forced';
const child = spawn(Deno.execPath(), [
  'run',
  '-P=cli',
  './-scripts/task.cli.ts',
  'start',
  '--mode',
  'dev',
], { stdio: 'inherit' });
let status: { code: number | null; signal: string | null } | undefined;
let failure: Error | undefined;
child.on('error', (error) => (failure = error));
child.once('close', (code, signal) => (status = { code, signal }));

try {
  await Time.waitFor(async () => {
    if (failure) throw failure;
    if (status) throw new Error('PTY CLI exited before readiness.');
    const sessions = await CellSession.list(root, { dir });
    for (const session of sessions) {
      if (!owned.has(session.pid)) console.info(`PTY_OWNER:${session.pid}`);
      owned.add(session.pid);
    }
    return sessions.some((session) => session.state === 'ready');
  }, { interval: 100, timeout: 120_000 });
  await Time.waitFor(async () => (await stty(['-g'])) !== before, { interval: 50, timeout: 5_000 });
  // Let the ready frame settle, then change the real terminal window. No injected SIGWINCH.
  await Time.delay(250);
  console.info('PTY_RESIZE_BEGIN');
  await stty(['cols', '47', 'rows', '12']);
  await Time.delay(500);
  console.info('PTY_RESIZE_END');
  if (forced) {
    // Stop only our acquired group while its keyboard has the PTY in raw mode. The wrapper
    // must enforce its grace deadline, kill the stopped group and restore input independently.
    for (const pid of owned) kill(-pid, 'SIGSTOP');
    child.kill('SIGTERM');
    console.info('PTY_FORCED_READY');
  } else {
    console.info('PTY_KEYBOARD_READY');
    // The outer proof writes a real Ctrl+C byte through the PTY master.
  }
  const exited = await Time.waitFor(() => status, { interval: 50, timeout: 10_000 });
  // Direct Cell PTY characterization returns 0 on keyboard quit, unlike OS-signal exit 130.
  expect(exited).to.eql({ code: forced ? 137 : 0, signal: null });
  expect(await stty(['-g'])).to.eql(before);
  const sessions = await CellSession.list(root, { dir });
  expect(sessions.length).to.eql(forced ? 1 : 0);
  // SIGKILL cannot run Cell's metadata cleanup. Remove only the fixture's recorded owner.
  for (const session of sessions) {
    expect(owned.has(session.pid)).to.eql(true);
    await CellSession.remove(session, { dir });
  }
  const listener = Deno.listen({ hostname: 'localhost', port: 5173 });
  listener.close();
  console.info('PTY_RESTORED');
} finally {
  for (const pid of owned) killOwnedGroup(pid);
  if (!status) child.kill('SIGTERM');
  await Time.waitFor(() => status, { interval: 50, timeout: 10_000 });
  await stty([before]);
}

async function stty(args: readonly string[]) {
  const command = new Deno.Command('stty', {
    args: [...args],
    stdin: 'inherit',
    stdout: 'piped',
    stderr: 'piped',
  }).spawn();
  const timer = setTimeout(() => command.kill('SIGKILL'), 2_000);
  try {
    const result = await command.output();
    expect(result.code, new TextDecoder().decode(result.stderr)).to.eql(0);
    return new TextDecoder().decode(result.stdout).trim();
  } finally {
    clearTimeout(timer);
  }
}
