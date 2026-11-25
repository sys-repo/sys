import { describe, expect, it, Testing, Time } from './common.ts';
import { CellSession } from '../u/u.session.ts';
import { spawnPtyProof } from './u.fixture.cli.terminal.ts';

type Entry = 'cli' | 'root' | 'script';
type Mode = 'startup-failure' | 'cleanup-failure' | 'success' | 'keyboard' | 'sigint' | 'sigterm';

/** Real PTY proof, separate from routine unit discovery. */
describe('@sys/cell CLI animated terminal outcomes PTY', () => {
  for (const entry of ['cli', 'root', 'script'] as const) {
    for (const mode of ['startup-failure', 'cleanup-failure', 'success'] as const) {
      it(`${entry}: ${mode} preserves status, terminal mode and service cleanup`, () =>
        prove(entry, mode));
    }
  }
  it('Ctrl+C → exit 130 after terminal restoration and service cleanup', () =>
    prove('script', 'keyboard'));
});

// Opt-in reproduction: on macOS these signals can exit 130 without calling the service close hook.
describe('@sys/cell CLI animated OS signals PTY', () => {
  for (const mode of ['sigint', 'sigterm'] as const) {
    it(`${mode} → exit 130 after terminal restoration and service cleanup`, () =>
      prove('script', mode));
  }
});

async function prove(entry: Entry, mode: Mode) {
  const runtime = await Testing.dir('CellCli.terminal');
  const fixture = './src/m.cli/-test/u.fixture.cli.terminal.pty.ts';
  const args = Deno.build.os === 'darwin'
    ? ['-q', '/dev/null', Deno.execPath(), 'run', '-P=test', fixture, entry, mode]
    : [
      '-q',
      '-e',
      '-c',
      `exec "$CELL_PTY_DENO" run -P=test ${fixture} ${entry} ${mode}`,
      '/dev/null',
    ];
  const proof = spawnPtyProof(args, {
    [CellSession.D.env]: runtime.dir,
    CELL_PTY_DENO: Deno.execPath(),
    TERM: 'xterm-256color',
  });
  let completed = false;
  try {
    let interrupted = false;
    const status = await Time.waitFor(() => {
      if (proof.failure) throw proof.failure;
      const owner = /PTY_OWNER:(\d+)/.exec(proof.output);
      if (owner) proof.ownGroup(Number(owner[1]));
      if (
        mode === 'keyboard' && !interrupted && !proof.status &&
        proof.output.includes('PTY_KEYBOARD_READY')
      ) {
        interrupted = true;
        proof.child.stdin!.write('\u0003');
      }
      return proof.status;
    }, { interval: 50, timeout: 30_000 });
    expect(status, proof.output).to.eql({ code: 0, signal: null });
    // A real animated spinner installed cursor-exit hooks, not merely a screen reporter.
    expect(proof.output).to.contain('\u001b[?25l');
    if (mode.endsWith('-failure')) expect(proof.output).to.contain(`pty-${mode}`);
    expect(proof.output).to.contain('PTY_CLEAN');
    expect(proof.output).to.contain('PTY_STATUS_OK');
    completed = true;
  } finally {
    if (!completed) await proof.stop();
  }
}
