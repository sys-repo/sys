import { kill } from 'node:process';
import { Process } from '@sys/process/process';
import { describe, expect, Fs, it, Testing, Time } from '../../-test.ts';
import { CellSession } from '../u/u.session.ts';
import { Cli, stripAnsi } from '../common.ts';
import { sessionOf, sessionRoot, writeSession } from './u.fixture.kill.ts';
import { spawnCliProof } from './u.fixture.cli.vite.ts';

/** Real maintained sample: intentionally separate from routine unit discovery. */
describe('@sys/cell development CLI Vite process', () => {
  for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP'] as const) {
    it(`restricted CLI → Vite HTTP ready → ${signal} closes service and session`, async () => {
      assertPortFree();
      const runtime = await Testing.dir(`CellCli.vite.${signal}`);
      const root = await sessionRoot(Fs.resolve('./-sample/cell.vite'));
      const launcher = signal !== 'SIGTERM'
        ? ['task', 'cli']
        : ['run', '-P=cli', './-scripts/task.cli.ts'];
      const proof = spawnCliProof([
        ...launcher,
        'start',
        '--mode',
        'dev',
        '--reporter',
        'raw',
      ], { [CellSession.D.env]: runtime.dir });

      try {
        const ready = await Time.waitFor(async () => {
          if (proof.failure) throw proof.failure;
          if (proof.status) throw new Error(`CLI exited before readiness:\n${proof.output}`);
          const sessions = await CellSession.list(root, { dir: runtime.dir });
          // This fresh runtime is written only by our maintained sample. Acquire its detached
          // leader during startup, never discover teardown targets from stale records or ports.
          for (const session of sessions) proof.ownGroup(session.pid);
          return sessions.find((session) => session.state === 'ready');
        }, { interval: 100, timeout: 120_000 });
        if (!ready) throw new Error(`CLI did not become ready:\n${proof.output}`);
        expect(ready.mode).to.eql('dev');
        expect(ready.services.map((service) => service.use)).to.eql(['ViteService']);

        const res = await fetch('http://localhost:5173/', { signal: AbortSignal.timeout(5_000) });
        await res.body?.cancel();
        expect(res.status).to.eql(200);

        if (signal !== 'SIGTERM') {
          if (!proof.child.pid) throw new Error('CLI child has no pid.');
          kill(-proof.child.pid, signal);
        } else {
          expect(proof.child.kill(signal)).to.eql(true);
        }
        const exited = await Time.waitFor(() => proof.status, { interval: 50, timeout: 15_000 });
        expect(proof.failure).to.eql(undefined);
        expect(exited?.signal).to.eql(null);
        // A task can report its own hangup (129) or the translated graceful child exit (130).
        expect(signal === 'SIGHUP' ? [129, 130] : [130]).to.include(exited?.code);
        // The outer task may exit before its wrapper. Observe ownership release independently;
        // fallback below must never supply the cleanup needed for an assertion to pass.
        await Time.waitFor(async () => {
          return (await CellSession.list(root, { dir: runtime.dir })).length === 0;
        }, { interval: 50, timeout: 10_000 });
        assertPortFree();
      } finally {
        await proof.stop();
      }
    });
  }

  for (const mode of ['delayed', 'stalled'] as const) {
    it(`${mode} cleanup → duplicates coalesce, resize relays, termination stays bounded`, async () => {
      const proof = fixture(mode);
      try {
        const { port } = await fixtureReady(proof);
        const started = performance.now();
        expect(proof.child.kill('SIGINT')).to.eql(true);
        await Time.waitFor(() => proof.output.includes('CLOSING'), { timeout: 5_000 });
        expect(proof.child.kill('SIGINT')).to.eql(true);
        expect(proof.child.kill('SIGWINCH')).to.eql(true);
        await Time.waitFor(() => proof.output.includes('RESIZED'), { timeout: 5_000 });
        if (mode === 'stalled') {
          await Time.delay(1_000);
          expect(proof.child.kill('SIGTERM')).to.eql(true);
        }
        const status = await Time.waitFor(() => proof.status, { interval: 50, timeout: 8_000 });
        expect(status, proof.output).to.eql({ code: mode === 'delayed' ? 130 : 137, signal: null });
        expect(proof.output.includes('CLEAN')).to.eql(mode === 'delayed');
        expect(performance.now() - started).to.be.lessThan(8_000);
        const listener = Deno.listen({ hostname: '127.0.0.1', port });
        listener.close(); // The owned descendant's port, not just the wrapper PID, was released.
      } finally {
        await proof.stop();
      }
    });
  }

  it('leader exits before grace deadline → surviving descendant is terminated', async () => {
    const proof = fixture('leader-exit');
    try {
      const { port } = await fixtureReady(proof);
      expect(proof.child.kill('SIGTERM')).to.eql(true);
      const status = await Time.waitFor(() => proof.status, { interval: 50, timeout: 4_000 });
      expect(status, proof.output).to.eql({ code: 130, signal: null });
      expect(proof.output).to.contain('CLOSING');
      expect(proof.output).not.to.contain('CLEAN');
      const listener = Deno.listen({ hostname: '127.0.0.1', port });
      listener.close();
    } finally {
      await proof.stop();
    }
  });

  it('leftover session plus replacement listener → fallback preserves the unrelated listener', async () => {
    const runtime = await Testing.dir('CellCli.vite.replacement');
    const root = await sessionRoot(Fs.resolve('./-sample/cell.vite'));
    const proof = fixture('stalled', { [CellSession.D.env]: runtime.dir });
    try {
      const { pid, port } = await fixtureReady(proof);
      await proof.stop();
      await writeSession(
        runtime.dir,
        sessionOf({
          root,
          mode: 'dev',
          pid,
          resources: [{ service: 'view', resource: { kind: 'tcp-listener', port } }],
        }),
      );
      const server = Deno.serve({ hostname: '127.0.0.1', port, onListen: () => undefined }, () => {
        return new Response('replacement');
      });
      try {
        // Invoke the actual fallback again after the dead owner's port has been reused.
        await proof.stop();
        const res = await fetch(`http://127.0.0.1:${port}`, { signal: AbortSignal.timeout(2_000) });
        expect(await res.text()).to.eql('replacement');
        expect((await CellSession.list(root, { dir: runtime.dir })).length).to.eql(1);
      } finally {
        await server.shutdown();
      }
    } finally {
      await proof.stop();
    }
  });
});

describe('@sys/cell development CLI Vite PTY', () => {
  for (const mode of ['keyboard', 'forced'] as const) {
    it(`real PTY → screen resize and ${mode} shutdown restore input mode`, async () => {
      assertPortFree();
      const runtime = await Testing.dir('CellCli.vite.pty');
      const entry = './src/m.cli/-test/u.fixture.cli.vite.pty.ts';
      const args = Deno.build.os === 'darwin'
        ? ['-q', '/dev/null', Deno.execPath(), 'run', '-P=test', entry, mode]
        : ['-q', '-e', '-c', `exec "$CELL_PTY_DENO" run -P=test ${entry} ${mode}`, '/dev/null'];
      const proof = spawnCliProof(args, {
        [CellSession.D.env]: runtime.dir,
        CELL_PTY_DENO: Deno.execPath(),
        TERM: 'xterm-256color',
      }, 'script');
      try {
        await Time.waitFor(() => {
          if (proof.failure) throw proof.failure;
          if (proof.status) {
            throw new Error(`PTY exited before keyboard readiness:\n${proof.output}`);
          }
          for (const owner of proof.output.matchAll(/PTY_OWNER:(\d+)/g)) {
            proof.ownGroup(Number(owner[1]));
          }
          return proof.output.includes(
            mode === 'forced' ? 'PTY_FORCED_READY' : 'PTY_KEYBOARD_READY',
          );
        }, { interval: 100, timeout: 120_000 });
        const resize = proof.output.split('PTY_RESIZE_BEGIN')[1]?.split('PTY_RESIZE_END')[0] ?? '';
        // Terminal repaint is the contract here: assert a real frame arrived after a kernel
        // window-size change, then measure its rendered rows independently of ANSI styling.
        expect(resize).to.contain('\u001b[?2026h');
        expect(stripAnsi(resize)).to.contain('view --mode=dev');
        const rows = resize.split(/\u001b\[\d+;1H\u001b\[2K/).slice(1);
        expect(rows.length).to.be.greaterThan(0);
        for (const row of rows) {
          expect(Cli.Fmt.Text.Width.measure(stripAnsi(row).trim())).to.be.at.most(47);
        }
        if (mode === 'keyboard') proof.child.stdin!.write('\u0003');
        const status = await Time.waitFor(() => proof.status, { interval: 50, timeout: 15_000 });
        expect(status, proof.output).to.eql({ code: 0, signal: null });
        expect(proof.output).to.contain('PTY_RESTORED');
      } finally {
        await proof.stop();
      }
    });
  }
});

describe('@sys/cell development CLI Vite startup failure', () => {
  it('Vite startup failure → non-zero child status reaches the CLI caller', async () => {
    const runtime = await Testing.dir('CellCli.vite.start-failure');
    const root = await sessionRoot(Fs.resolve('./-sample/cell.vite'));
    const listener = Deno.listen({ hostname: 'localhost', port: 5173 });
    try {
      const res = await Process.capture({
        cmd: Deno.execPath(),
        cwd: Deno.cwd(),
        args: [
          'run',
          '-P=cli',
          './-scripts/task.cli.ts',
          'start',
          '--mode',
          'dev',
          '--reporter',
          'raw',
        ],
        env: { [CellSession.D.env]: runtime.dir },
        executionTimeout: 30_000,
        maxStdoutBytes: 200_000,
        maxStderrBytes: 200_000,
        terminationGrace: 5_000,
      });
      expect(res.outcome).to.eql('exited');
      expect(res.code, `${res.text.stdout}\n${res.text.stderr}`).to.eql(1);
      expect(res.text.stdout).to.contain('5173');
      expect(await CellSession.list(root, { dir: runtime.dir })).to.eql([]);
    } finally {
      listener.close();
    }
  });
});

function assertPortFree() {
  const listener = Deno.listen({ hostname: 'localhost', port: 5173 });
  listener.close();
}

function fixture(mode: string, env?: Record<string, string>) {
  return spawnCliProof([
    'run',
    '-P=cli',
    './src/m.cli/-test/u.fixture.cli.vite.launch.ts',
    mode,
  ], env);
}

async function fixtureReady(proof: ReturnType<typeof spawnCliProof>) {
  const ready = await Time.waitFor(() => {
    if (proof.failure) throw proof.failure;
    if (proof.status) throw new Error(`Fixture exited before ready:\n${proof.output}`);
    const owner = /OWNER:(\d+)/.exec(proof.output);
    if (owner) proof.ownGroup(Number(owner[1]));
    const leaf = /LEAF:(\d+):(\d+)/.exec(proof.output);
    if (owner && leaf) return { pid: Number(owner[1]), port: Number(leaf[2]) };
  }, { interval: 50, timeout: 15_000 });
  if (!ready) throw new Error(`Fixture did not become ready:\n${proof.output}`);
  return ready;
}
