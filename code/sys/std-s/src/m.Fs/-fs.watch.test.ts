import { describe, expect, it } from '../-test.ts';
import { sampleDir } from './-u.ts';
import { rx } from './common.ts';
import { Watch } from './m.Watch.ts';
import { Fs } from './mod.ts';

describe('Fs.Watch', () => {
  const SAMPLE = sampleDir();

  it('|→ ensure test directory exists', () => Fs.ensureDir(SAMPLE.dir));

  it('API', () => {
    expect(Fs.Watch).to.equal(Watch);
    expect(Fs.watch).to.equal(Watch.start);
  });

  describe('lifecycle', () => {
    it('create: single paths', () => {
      const path = SAMPLE.uniq();
      const watcher = Fs.watch(path);
      expect(watcher.disposed).to.eql(false);
      expect(watcher.paths).to.eql([path]);
      expect(watcher.is.recursive).to.eql(true); // NB: default.
      watcher.dispose();
      expect(watcher.disposed).to.eql(true);
    });

    it('create: multiple paths → dispose$', () => {
      const { dispose, dispose$ } = rx.disposable();
      const p1 = SAMPLE.uniq();
      const p2 = SAMPLE.uniq();
      const watcher = Fs.watch([p1, p2], { recursive: false, dispose$ });
      expect(watcher.paths).to.eql([p1, p2]);
      expect(watcher.is.recursive).to.eql(false);
      expect(watcher.disposed).to.eql(false);
      dispose();
      expect(watcher.disposed).to.eql(true);
    });
  });
});
