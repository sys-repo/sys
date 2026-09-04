import { describe, expect, Fs, it, Testing, Time } from '../../-test.ts';
import { Process, stripAnsi } from '../common.ts';
import { CellCli } from '../mod.ts';
import { formatKillResult } from '../u/u.kill.fmt.ts';
import { killCell } from '../u/u.kill.ts';
import { CellSession } from '../u/u.session.ts';
import { silent } from './u.fixture.ts';
import {
  addHoldService,
  addResourceService,
  cellFixture,
  cleanup,
  DEAD_PID,
  runCellCli,
  runRootCellCli,
  sessionOf,
  sessionRoot,
  spawnCellStart,
  spawnHoldProcess,
  spawnReadyServer,
  waitForSession,
  withRuntimeDir,
  writeSession,
} from './u.fixture.kill.ts';

describe('@sys/cell/cli u.kill', () => {
  describe('session safety matrix', () => {
    it('dry-run → reports fresh matching sessions without mutation', async () => {
      const fs = await cellFixture('CellCli.kill.dry-run');
      const runtime = await Testing.dir('CellCli.kill.dry-run.runtime');
      const root = await sessionRoot(fs.dir);
      const session = await writeSession(runtime.dir, sessionOf({ root, mode: 'dev' }));

      const res = await killCell({
        dir: fs.dir,
        mode: 'dev',
        dryRun: true,
        sessionDir: runtime.dir,
      });
      const sessions = await CellSession.list(root, { dir: runtime.dir });

      expect(res.code).to.eql(0);
      expect(res.sessions.map((item) => item.status)).to.eql(['would-terminate']);
      expect(sessions.map((item) => item.id)).to.eql([session.id]);
    });

    it('dry-run → leaves stale dead records in place', async () => {
      const fs = await cellFixture('CellCli.kill.dry-run.stale-dead');
      const runtime = await Testing.dir('CellCli.kill.dry-run.stale-dead.runtime');
      const root = await sessionRoot(fs.dir);
      const session = await writeSession(
        runtime.dir,
        sessionOf({ root, pid: DEAD_PID, updatedAt: Time.now.timestamp - 10_000 }),
      );

      const res = await killCell({ dir: fs.dir, dryRun: true, sessionDir: runtime.dir });
      const sessions = await CellSession.list(root, { dir: runtime.dir });

      expect(res.code).to.eql(0);
      expect(res.sessions.map((item) => item.status)).to.eql(['would-remove-stale']);
      expect(sessions.map((item) => item.id)).to.eql([session.id]);
    });

    it('stale dead pid → removes the stale session record', async () => {
      const fs = await cellFixture('CellCli.kill.dead-stale');
      const runtime = await Testing.dir('CellCli.kill.dead-stale.runtime');
      const root = await sessionRoot(fs.dir);
      await writeSession(
        runtime.dir,
        sessionOf({ root, pid: DEAD_PID, updatedAt: Time.now.timestamp - 10_000 }),
      );

      const res = await killCell({ dir: fs.dir, sessionDir: runtime.dir });
      const sessions = await CellSession.list(root, { dir: runtime.dir });

      expect(res.code).to.eql(0);
      expect(res.sessions.map((item) => item.status)).to.eql(['not-running']);
      expect(sessions).to.eql([]);
    });

    it('stale running pid → skips even with force', async () => {
      const fs = await cellFixture('CellCli.kill.stale-running');
      const runtime = await Testing.dir('CellCli.kill.stale-running.runtime');
      const root = await sessionRoot(fs.dir);
      await writeSession(
        runtime.dir,
        sessionOf({ root, updatedAt: Time.now.timestamp - 10_000 }),
      );

      const res = await killCell({
        dir: fs.dir,
        force: true,
        sessionDir: runtime.dir,
        freshFor: 1,
      });
      const sessions = await CellSession.list(root, { dir: runtime.dir });

      expect(res.code).to.eql(1);
      expect(res.sessions.map((item) => item.status)).to.eql(['stale-running']);
      expect(sessions.length).to.eql(1);
    });

    it('future heartbeat timestamp → is not trusted as fresh identity', async () => {
      const fs = await cellFixture('CellCli.kill.future-running');
      const runtime = await Testing.dir('CellCli.kill.future-running.runtime');
      const root = await sessionRoot(fs.dir);
      await writeSession(
        runtime.dir,
        sessionOf({ root, updatedAt: Time.now.timestamp + 10_000 }),
      );

      const res = await killCell({ dir: fs.dir, sessionDir: runtime.dir });
      const sessions = await CellSession.list(root, { dir: runtime.dir });

      expect(res.code).to.eql(1);
      expect(res.sessions.map((item) => item.status)).to.eql(['stale-running']);
      expect(sessions.length).to.eql(1);
    });
  });

  describe('root and mode targeting', () => {
    it('--mode → targets only the selected service graph mode', async () => {
      const fs = await cellFixture('CellCli.kill.mode');
      const runtime = await Testing.dir('CellCli.kill.mode.runtime');
      const root = await sessionRoot(fs.dir);
      await writeSession(runtime.dir, sessionOf({ id: 'dev-session', root, mode: 'dev' }));
      await writeSession(runtime.dir, sessionOf({ id: 'prod-session', root, mode: 'prod' }));

      const res = await killCell({
        dir: fs.dir,
        mode: 'dev',
        dryRun: true,
        sessionDir: runtime.dir,
      });
      const all = await killCell({ dir: fs.dir, dryRun: true, sessionDir: runtime.dir });

      expect(res.sessions.map((item) => item.id)).to.eql(['dev-session']);
      expect(res.sessions.map((item) => item.status)).to.eql(['would-terminate']);
      expect(all.sessions.map((item) => item.id)).to.eql(['dev-session', 'prod-session']);
    });

    it('omitted dir → discovers the nearest Cell root', async () => {
      const fs = await cellFixture('CellCli.kill.discover-root');
      const runtime = await Testing.dir('CellCli.kill.discover-root.runtime');
      const nested = Fs.join(fs.dir, 'apps/view');
      await Fs.ensureDir(nested);
      await writeSession(runtime.dir, sessionOf({ root: await sessionRoot(fs.dir), mode: 'dev' }));

      const output = await runCellCli(['kill', '--dry-run', '--mode', 'dev'], {
        cwd: nested,
        runtime: runtime.dir,
      });
      const text = stripAnsi(new TextDecoder().decode(output.stdout));

      expect(output.code).to.eql(0);
      expect(text).to.contain('@sys/cell kill');
      expect(text).to.contain('mode:      dev');
      expect(text).to.contain('would-terminate');
    });
  });

  describe('entrypoint integration', () => {
    it('root module kill → propagates skipped-session exit code', async () => {
      const fs = await cellFixture('CellCli.kill.root-exit-code');
      const runtime = await Testing.dir('CellCli.kill.root-exit-code.runtime');
      await writeSession(
        runtime.dir,
        sessionOf({ root: await sessionRoot(fs.dir), updatedAt: Time.now.timestamp - 10_000 }),
      );

      const output = await runRootCellCli(['kill', fs.dir], { runtime: runtime.dir });
      const text = stripAnsi(new TextDecoder().decode(output.stdout));

      expect(output.code).to.eql(1);
      expect(text).to.contain('stale-running');
    });
  });

  describe('declared resource reaping', () => {
    it('dry-run → reports declared listeners without signalling', async () => {
      const fs = await cellFixture('CellCli.kill.resource.dry-run');
      const runtime = await Testing.dir('CellCli.kill.resource.dry-run.runtime');
      const port = Testing.randomPort();
      await addResourceService(fs.dir, { variants: { dev: { host: '127.0.0.1', port } } });
      const child = await spawnReadyServer(port);
      try {
        const res = await killCell({
          dir: fs.dir,
          mode: 'dev',
          dryRun: true,
          sessionDir: runtime.dir,
        });

        expect(res.code).to.eql(0);
        expect(res.sessions).to.eql([]);
        expect(res.resources.map((item) => item.status)).to.eql(['would-terminate']);
        expect(res.resources[0].listeners.map((item) => item.pid)).to.eql([child.pid]);
        expect(Process.isRunning(child.pid)).to.eql(true);
      } finally {
        await cleanup(child);
      }
    });

    it('explicit --mode → can reap an owner-declared orphan listener', async () => {
      const fs = await cellFixture('CellCli.kill.resource.orphan');
      const runtime = await Testing.dir('CellCli.kill.resource.orphan.runtime');
      const port = Testing.randomPort();
      await addResourceService(fs.dir, { variants: { dev: { host: '127.0.0.1', port } } });
      const child = await spawnReadyServer(port);
      try {
        const res = await killCell({ dir: fs.dir, mode: 'dev', sessionDir: runtime.dir });
        await child.status;

        expect(res.code).to.eql(0);
        expect(res.sessions).to.eql([]);
        expect(res.resources.map((item) => item.status)).to.eql(['terminated']);
        expect(res.resources[0].listeners.map((item) => item.pid)).to.eql([child.pid]);
      } finally {
        await cleanup(child);
      }
    });

    it('no-mode with no sessions → does not target descriptor variants', async () => {
      const fs = await cellFixture('CellCli.kill.resource.no-mode-no-session');
      const runtime = await Testing.dir('CellCli.kill.resource.no-mode-no-session.runtime');
      const port = Testing.randomPort();
      await addResourceService(fs.dir, { variants: { dev: { host: '127.0.0.1', port } } });
      const child = await spawnReadyServer(port);
      try {
        const res = await killCell({ dir: fs.dir, sessionDir: runtime.dir });

        expect(res.code).to.eql(0);
        expect(res.sessions).to.eql([]);
        expect(res.resources).to.eql([]);
        expect(Process.isRunning(child.pid)).to.eql(true);
      } finally {
        await cleanup(child);
      }
    });

    it('mode scope → does not terminate another mode listener', async () => {
      const fs = await cellFixture('CellCli.kill.resource.mode-scope');
      const runtime = await Testing.dir('CellCli.kill.resource.mode-scope.runtime');
      const devPort = Testing.randomPort();
      const prodPort = Testing.randomPort();
      await addResourceService(fs.dir, {
        variants: {
          dev: { host: '127.0.0.1', port: devPort },
          prod: { host: '127.0.0.1', port: prodPort },
        },
      });
      const dev = await spawnReadyServer(devPort);
      const prod = await spawnReadyServer(prodPort);
      try {
        const res = await killCell({ dir: fs.dir, mode: 'dev', sessionDir: runtime.dir });
        await dev.status;

        expect(res.resources.map((item) => item.port)).to.eql([devPort]);
        expect(res.resources.map((item) => item.status)).to.eql(['terminated']);
        expect(Process.isRunning(prod.pid)).to.eql(true);
      } finally {
        await cleanup(dev);
        await cleanup(prod);
      }
    });

    it('host filter → does not terminate another host listener on the same port', async () => {
      const fs = await cellFixture('CellCli.kill.resource.host-scope');
      const runtime = await Testing.dir('CellCli.kill.resource.host-scope.runtime');
      const port = Testing.randomPort();
      await addResourceService(fs.dir, { variants: { dev: { host: '127.0.0.2', port } } });
      const child = await spawnReadyServer(port, '127.0.0.1');
      try {
        const res = await killCell({ dir: fs.dir, mode: 'dev', sessionDir: runtime.dir });
        const text = stripAnsi(formatKillResult(res));

        expect(res.resources.map((item) => item.status)).to.eql(['not-listening']);
        expect(text).to.contain('done: no live sessions or listeners to clear');
        expect(Process.isRunning(child.pid)).to.eql(true);
      } finally {
        await cleanup(child);
      }
    });

    it('stale-running sessions → skip resource cleanup even with force', async () => {
      const fs = await cellFixture('CellCli.kill.resource.stale-running');
      const runtime = await Testing.dir('CellCli.kill.resource.stale-running.runtime');
      const root = await sessionRoot(fs.dir);
      const port = Testing.randomPort();
      const resource = { service: 'view', resource: { kind: 'tcp-listener' as const, port } };
      await writeSession(
        runtime.dir,
        sessionOf({
          root,
          mode: 'dev',
          resources: [resource],
          updatedAt: Time.now.timestamp - 10_000,
        }),
      );
      const child = await spawnReadyServer(port);
      try {
        const res = await killCell({
          dir: fs.dir,
          mode: 'dev',
          force: true,
          sessionDir: runtime.dir,
          freshFor: 1,
        });

        expect(res.code).to.eql(1);
        expect(res.sessions.map((item) => item.status)).to.eql(['stale-running']);
        expect(res.resources.map((item) => item.status)).to.eql(['skipped']);
        expect(Process.isRunning(child.pid)).to.eql(true);
      } finally {
        await cleanup(child);
      }
    });

    it('stale-dead sessions → may reap recorded resources', async () => {
      const fs = await cellFixture('CellCli.kill.resource.stale-dead');
      const runtime = await Testing.dir('CellCli.kill.resource.stale-dead.runtime');
      const root = await sessionRoot(fs.dir);
      const port = Testing.randomPort();
      await writeSession(
        runtime.dir,
        sessionOf({
          root,
          mode: 'dev',
          pid: DEAD_PID,
          resources: [{ service: 'view', resource: { kind: 'tcp-listener', port } }],
          updatedAt: Time.now.timestamp - 10_000,
        }),
      );
      const child = await spawnReadyServer(port);
      try {
        const res = await killCell({ dir: fs.dir, mode: 'dev', sessionDir: runtime.dir });
        await child.status;
        const sessions = await CellSession.list(root, { dir: runtime.dir });

        expect(res.code).to.eql(0);
        expect(res.sessions.map((item) => item.status)).to.eql(['not-running']);
        expect(res.resources.map((item) => item.status)).to.eql(['terminated']);
        expect(sessions).to.eql([]);
      } finally {
        await cleanup(child);
      }
    });

    it('invalid resource declarations fail before any session mutation', async () => {
      const fs = await cellFixture('CellCli.kill.resource.invalid-preflight');
      const runtime = await Testing.dir('CellCli.kill.resource.invalid-preflight.runtime');
      const root = await sessionRoot(fs.dir);
      await addResourceService(fs.dir, { variants: { dev: { host: '127.0.0.1', port: 0 } } });
      const child = spawnHoldProcess();
      await writeSession(runtime.dir, sessionOf({ root, mode: 'dev', pid: child.pid }));
      try {
        const error = await catchKillCell({ dir: fs.dir, mode: 'dev', sessionDir: runtime.dir });
        const sessions = await CellSession.list(root, { dir: runtime.dir });

        expect(error?.message).to.eql(
          "Cell.Services.resources: service 'view' declared invalid resource: resource 0 has invalid tcp port: 0.",
        );
        expect(sessions.map((item) => item.pid)).to.eql([child.pid]);
        expect(Process.isRunning(child.pid)).to.eql(true);
      } finally {
        await cleanup(child);
      }
    });
  });

  describe('live supervisor termination', () => {
    it('kill → terminates a live start session from another process', async () => {
      const fs = await cellFixture('CellCli.kill.live-start');
      const runtime = await Testing.dir('CellCli.kill.live-start.runtime');
      await addHoldService(fs.dir);

      await withRuntimeDir(runtime.dir, async () => {
        const child = spawnCellStart(fs.dir, runtime.dir);
        try {
          await waitForSession(fs.dir, runtime.dir, child.pid);

          const res = await silent(() => CellCli.run({ argv: ['kill', fs.dir] }));
          const status = await child.status;
          const sessions = await CellSession.list(await sessionRoot(fs.dir), { dir: runtime.dir });

          expect(res.kind).to.eql('kill');
          if (res.kind !== 'kill') throw new Error('expected kill result');
          expect(res.code).to.eql(0);
          expect(res.sessions.map((item) => item.pid)).to.eql([child.pid]);
          expect(res.sessions[0].status).to.eql('terminated');
          expect(status.code).to.eql(130);
          expect(sessions).to.eql([]);
        } finally {
          await cleanup(child);
        }
      });
    });
  });
});

async function catchKillCell(args: Parameters<typeof killCell>[0]): Promise<Error | undefined> {
  try {
    await killCell(args);
  } catch (err) {
    return err as Error;
  }
}
