import { describe, expect, it, sampleDir, Time } from '../-test.ts';
import { type t, Rx, slug } from './common.ts';

import { Fs } from '../m.Fs/mod.ts';
import { Watch } from './mod.ts';

describe('Fs.Watch', () => {
  const SAMPLE = sampleDir('Fs.Watch');

  it('|→ ensure test directory exists', () => Fs.ensureDir(SAMPLE.dir));

  it('API', async () => {
    const m = await import('./mod.ts');
    expect(m.Watch).to.equal(Watch);
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
      const { dispose, dispose$ } = Rx.disposable();
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
        expect(watcher.error?.message).to.includes('Path to watch does not exist');
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

  describe('⚡️ change events', () => {
    type E = t.FsWatchEvent;
    const waitFor = async (fn: () => boolean, timeout = 1200, interval = 20) => {
      const startedAt = Date.now();
      while (Date.now() - startedAt < timeout) {
        if (fn()) return;
        await Time.wait(interval);
      }
      throw new Error(`Timed out waiting for watcher event (${timeout}ms).`);
    };
    const includesPath = (fired: E[], path: string) => {
      const normalized = Fs.Path.normalize(path);
      return fired.some((e) => e.paths.some((p) => Fs.Path.normalize(p) === normalized));
    };
    const includesAnyPath = (fired: E[], paths: string[]) => {
      return paths.some((path) => includesPath(fired, path));
    };
    const assertIncludesPath = (fired: E[], path: string, expectedMatch: boolean) => {
      expect(includesPath(fired, path)).to.eql(expectedMatch);
    };

    it('fires on change', async () => {
      const [dir] = await SAMPLE.ensureExists();
      await Time.wait(100);

      const watcher = await Fs.watch(dir);
      const fired: E[] = [];
      watcher.$.subscribe((e) => fired.push(e));
      expect(fired.length).to.eql(0);

      const path = SAMPLE.uniq();
      await Deno.writeTextFile(path, slug());
      await waitFor(() => fired.length > 0);

      const kinds = fired.map((e) => e.kind);
      expect(kinds).to.include('create');
      expect(kinds).to.include('modify');
      watcher.dispose();
    });

    it('recursive', async () => {
      const test = async (recursive: boolean) => {
        const [dir] = await SAMPLE.ensureExists();
        const childDir = Fs.join(dir, 'foo', 'bar');
        const childFilepath = Fs.join(childDir, 'file.txt');
        const writeChild = () => Deno.writeTextFile(childFilepath, slug());
        await Fs.ensureDir(childDir);
        await writeChild();
        await Time.wait(100); // Allow setup to complete before catching events.

        const watcher = await Fs.watch(dir, { recursive });
        const fired: E[] = [];
        watcher.$.subscribe((e) => fired.push(e));
        expect(fired).to.eql([]);

        await writeChild();
        if (recursive) {
          await waitFor(() => includesAnyPath(fired, [childFilepath, childDir]));
        } else {
          await Time.wait(120);
        }

        expect(includesAnyPath(fired, [childFilepath, childDir])).to.eql(recursive);
        watcher.dispose();
      };

      await test(true);
      await test(false); // NB: non-recusive, the child-file will not trigger.
    });

    it('multiple paths', async () => {
      const uniq = SAMPLE.uniq;
      const [, d1, d2, d3] = await SAMPLE.ensureExists(uniq('d1'), uniq('d2'), uniq('d3'));
      await Time.wait(100); // Allow setup to complete before catching events.

      const watcher = await Fs.watch([d1, d2]);
      const fired: E[] = [];
      watcher.$.subscribe((e) => fired.push(e));
      expect(fired).to.eql([]);

      // Changes to watched dirs.
      const file1 = Fs.join(d1, 'file.txt');
      const file2 = Fs.join(d2, 'file.txt');
      const file3 = Fs.join(d3, 'file.txt');

      await Deno.writeTextFile(file1, slug());
      await Deno.writeTextFile(file2, slug());
      await waitFor(() => includesPath(fired, file1) && includesPath(fired, file2));

      assertIncludesPath(fired, file1, true);
      assertIncludesPath(fired, file2, true);
      assertIncludesPath(fired, file3, false);

      // Write the the non-monitored path.
      const length = fired.length;
      await Deno.writeTextFile(file3, slug());
      await Time.wait(120);
      expect(fired.length).to.eql(length); // NB: no-change

      watcher.dispose();
    });

    it('multiple paths (non-recursive)', async () => {
      const uniq = SAMPLE.uniq;
      const [, d1, d2, d3] = await SAMPLE.ensureExists(uniq('d1'), uniq('d2'), uniq('d3'));
      await Time.wait(100); // Allow setup to complete before catching events.

      const watcher = await Fs.watch([d1, d2], { recursive: false });
      const fired: E[] = [];
      watcher.$.subscribe((e) => fired.push(e));
      expect(fired).to.eql([]);

      const file1 = Fs.join(d1, 'file.txt');
      const file2 = Fs.join(d2, 'file.txt');
      const file3 = Fs.join(d3, 'file.txt');

      await Deno.writeTextFile(file1, slug());
      await Deno.writeTextFile(file2, slug());
      await waitFor(() => includesPath(fired, file1) && includesPath(fired, file2));

      assertIncludesPath(fired, file1, true);
      assertIncludesPath(fired, file2, true);
      assertIncludesPath(fired, file3, false);

      watcher.dispose();
    });
  });
});
