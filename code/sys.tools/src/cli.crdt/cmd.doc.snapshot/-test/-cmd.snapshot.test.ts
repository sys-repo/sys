import { describe, expect, expectError, it } from '../../../-test.ts';
import { Cli, Fs, Pkg } from '../../common.ts';
import { withTmpDir } from '../../-test/-fixtures.ts';
import { runSnapshot } from '../cmd.snapshot.ts';

const ROOT = '2BAhULFYeTCbw7iEcVuqs1UqdAaJ';

/** Observe only the presentation capabilities used by the command. */
function output() {
  let starts = 0;
  let stops = 0;
  const lines: string[] = [];
  const effects = {
    spinner(text: string) {
      starts += 1;
      return {
        text,
        stop() {
          stops += 1;
        },
      };
    },
    log(text = '') {
      expect(stops).to.eql(1);
      lines.push(Cli.stripAnsi(text));
    },
  };
  return {
    effects,
    lines,
    get starts() {
      return starts;
    },
    get stops() {
      return stops;
    },
  };
}

function result(dir: string) {
  return { dir, processed: [ROOT], bytes: { json: 2, binary: 0 } };
}

describe('snapshot command settlement', () => {
  it('successful snapshot → stop once before success presentation', async () => {
    await withTmpDir(async (dir) => {
      const observed = output();
      const started = Promise.withResolvers<void>();
      const release = Promise.withResolvers<void>();
      const pending = runSnapshot(ROOT, async (onProgress) => {
        onProgress({ kind: 'start', root: ROOT, dir, timestamp: 0 });
        started.resolve();
        await release.promise;
        await Fs.write(Fs.join(dir, 'snapshot.json'), '{}', { throw: true });
        return result(dir);
      }, observed.effects);
      try {
        await Promise.race([started.promise, pending]);
        expect(observed.starts).to.eql(1);
        expect(observed.stops).to.eql(0);
        expect(observed.lines).to.eql([]);
      } finally {
        release.resolve();
        await pending;
      }
      expect(observed.stops).to.eql(1);
      expect(observed.lines.join('\n')).to.include('snapshot backed up');
      const verified = await Pkg.Dist.Local.verify({
        dir: await Fs.realPath(dir),
        limits: { manifestBytes: 4096, entries: 10, fileBytes: 1024, totalBytes: 4096 },
      });
      expect(verified.kind).to.eql('verified');
    });
  });

  for (const failure of ['empty inventory', 'manifest save'] as const) {
    it(`${failure} rejection → stop once, propagate failure, no success summary`, async () => {
      await withTmpDir(async (dir) => {
        const observed = output();
        await expectError(() =>
          runSnapshot(ROOT, async () => {
            if (failure === 'manifest save') {
              await Fs.write(Fs.join(dir, 'snapshot.json'), '{}', { throw: true });
              await Fs.ensureDir(Fs.join(dir, 'dist.json'));
              const unsaved = await Pkg.Dist.compute({ dir, save: false });
              expect(unsaved.kind).to.eql('computed');
            }
            return result(dir);
          }, observed.effects), 'Dist computation failed.');
        expect(observed.starts).to.eql(1);
        expect(observed.stops).to.eql(1);
        expect(observed.lines).to.eql([]);
        if (failure === 'manifest save') {
          expect(await Fs.Is.dir(Fs.join(dir, 'dist.json'))).to.eql(true);
          expect((await Fs.readText(Fs.join(dir, 'snapshot.json'))).data).to.eql('{}');
        } else {
          expect(await Fs.exists(Fs.join(dir, 'dist.json'))).to.eql(false);
        }
      });
    });
  }

  it('walk rejection → original failure propagates after exactly one stop', async () => {
    const observed = output();
    const failure = new Error('snapshot walk failed');
    let caught: unknown;
    try {
      await runSnapshot(ROOT, () => Promise.reject(failure), observed.effects);
    } catch (error) {
      caught = error;
    }
    expect(caught).to.equal(failure);
    expect(observed.starts).to.eql(1);
    expect(observed.stops).to.eql(1);
    expect(observed.lines).to.eql([]);
  });
});
