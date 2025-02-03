import { type t, describe, expect, it } from '../-test.ts';
import { Fs } from './mod.ts';

describe('Fs: tree walking helpers', () => {
  describe('Fs.walkUp', () => {
    it('starts at dir', async () => {
      const fired: t.FsWalkUpCallbackArgs[] = [];
      await Fs.walkUp('./deno.json', (e) => fired.push(e));

      expect(fired.length).to.greaterThan(3);
      const first = fired[0];
      const last = fired[fired.length - 1];

      expect(first.dir).to.eql(Fs.resolve('.')); // NB: the parent dir, not the given file.
      expect(last.dir).to.eql('/');
    });

    it('walks up and stops before end', async () => {
      const fired: t.FsWalkUpCallbackArgs[] = [];
      await Fs.walkUp('./deno.json', (e) => {
        fired.push(e);
        if (fired.length > 1) e.stop();
      });
      expect(fired.length).to.eql(2); // NB: because stopped.
    });

    it('retrieves files from callback', async () => {
      const fired: t.FsWalkUpCallbackArgs[] = [];
      const files: t.FsWalkFile[] = [];
      await Fs.walkUp('./deno.json', async (e) => {
        fired.push(e);
        files.push(...(await e.files()));
        e.stop();
      });
      const names = files.map((e) => e.name);
      expect(names.includes('README.md')).to.eql(true);
      expect(names.includes('deno.json')).to.eql(true);
    });
  });
});
