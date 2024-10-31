import { describe, expect, it } from '../-test.ts';
import { sampleDir } from './-u.ts';
import { rx } from './common.ts';
import { Watch } from './m.Watch.ts';
import { Fs } from './mod.ts';

describe('Fs.Watch', () => {
  const SAMPLE = sampleDir('fs-watch');

  it('|→ ensure test directory exists', () => Fs.ensureDir(SAMPLE.dir));

  it('API', () => {
    expect(Fs.Watch).to.equal(Watch);
    expect(Fs.watch).to.equal(Watch.start);
  });

  describe('lifecycle', () => {
    it('create: single path (default params)', async () => {
      const [_, path] = await SAMPLE.ensureExists(SAMPLE.uniq());
      const watcher = await Fs.watch(path);
      expect(watcher.disposed).to.eql(false);
      expect(watcher.paths).to.eql([path]);
      expect(watcher.exists).to.eql(true);
      expect(watcher.is.recursive).to.eql(true); // NB: default.
      expect(watcher.error).to.eql(undefined);
      watcher.dispose();
      expect(watcher.disposed).to.eql(true);
    });

    it('create: multiple paths, not recursive → dispose$', async () => {
      const { dispose, dispose$ } = rx.disposable();
      const [_, p1, p2] = await SAMPLE.ensureExists(SAMPLE.uniq(), SAMPLE.uniq());
      const watcher = await Fs.watch([p1, p2], { recursive: false, dispose$ });
      expect(watcher.paths).to.eql([p1, p2]);
      expect(watcher.exists).to.eql(true);
      expect(watcher.is.recursive).to.eql(false);
      expect(watcher.disposed).to.eql(false);
      expect(watcher.error).to.eql(undefined);
      dispose();
      expect(watcher.disposed).to.eql(true);
    });

    describe('errors', () => {
      it('fail: watch path (single) does not exist', async () => {
        const path = '404_foobar';
        const watcher = await Fs.watch(path);
        expect(watcher.exists).to.eql(false);
        expect(watcher.error?.message).to.includes('Watch path does not exist');
        expect(watcher.error?.message).to.includes(path);
        watcher.dispose();
      });

      it('fail: watch paths (plural) does not exist', async () => {
        const A_404 = '404_a';
        const B_404 = '404_b';
        const [_, p1] = await SAMPLE.ensureExists(SAMPLE.uniq());

        const watcher = await Fs.watch([A_404, p1, B_404]);
        watcher.dispose();

        expect(watcher.paths).to.eql([A_404, p1, B_404]);
        expect(watcher.exists).to.eql(false);

        const error = watcher.error;
        expect(error?.errors?.length).to.eql(2);
        expect(error?.errors?.[0].message).to.include(A_404);
        expect(error?.errors?.[1].message).to.include(B_404);
        expect(error?.message).to.includes(
          'Several errors occured while watching file-system paths',
        );
      });
    });
  });

  });
});
