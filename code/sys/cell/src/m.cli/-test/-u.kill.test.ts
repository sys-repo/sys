import { describe, expect, Fs, it, Testing, Time } from '../../-test.ts';
import { stripAnsi } from '../common.ts';
import { CellCli } from '../mod.ts';
import { killCell } from '../u/u.kill.ts';
import { CellSession } from '../u/u.session.ts';
import { silent } from './u.fixture.ts';
import {
  addHoldService,
  cellFixture,
  cleanup,
  DEAD_PID,
  runCellCli,
  runRootCellCli,
  sessionOf,
  sessionRoot,
  spawnCellStart,
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
      expect(text).to.contain('Cell kill');
      expect(text).to.contain('mode: dev');
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
