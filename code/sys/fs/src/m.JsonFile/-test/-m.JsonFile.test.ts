import { beforeAll, describe, expect, it, slug } from '../../-test.ts';
import { Fs, type t, Time } from '../common.ts';
import { JsonFile } from '../mod.ts';

describe('JsonFile', () => {
  const root = '.tmp/test/m.JsonFile';
  beforeAll(async () => void (await Fs.remove(root)));

  type D = t.JsonFileDoc & { msg?: string; count: number };

  it('API', async () => {
    const m = await import('@sys/fs/file');
    expect(m.JsonFile).to.equal(JsonFile);
  });

  it('JsonFile.default()', () => {
    const a = JsonFile.default();
    const b = JsonFile.default();
    expect(a).to.eql({ '.meta': { createdAt: 0 } });
    expect(a).to.not.equal(b);
  });

  describe('get', () => {
    it('gets a new file', async () => {
      const dir = Fs.join(root, slug());
      const pathA = Fs.join(dir, 'foo.json');
      const pathB = Fs.join(dir, 'bar.json');

      // NB: zero `createdAt` date is auto-updated by at creation by the tool.
      const initial: D = { '.meta': { createdAt: 0 }, count: 0 };

      const before = Time.now.timestamp;
      const a = await JsonFile.get<D>(pathA, initial);
      const b = await JsonFile.get<D>(pathB, initial);
      const after = Time.now.timestamp;

      expect(a.current['.meta'].createdAt).to.be.within(before, after);
      expect(b.current['.meta'].createdAt).to.be.within(before, after);

      expect(a.fs.path).to.eql(Fs.resolve(pathA));
      expect(b.fs.path).to.eql(Fs.resolve(pathB));

      // Different instances based on directory.
      expect(a).to.not.equal(b);
    });

    it('extend fields including .meta', async () => {
      type T = t.JsonFileDoc & {
        '.meta': t.JsonFileDoc['.meta'] & { tmp: number };
        foo: string;
      };

      const initial: T = { '.meta': { createdAt: 0, tmp: 123 }, foo: 'hello' };
      const path = Fs.join(root, slug(), 'foo.json');

      const before = Time.now.timestamp;
      const file = await JsonFile.get<T>(path, initial);
      const after = Time.now.timestamp;

      expect(file.current['.meta'].createdAt).to.be.within(before, after);

      expect(file.current['.meta'].tmp).to.eql(123);
      expect(file.current.foo).to.eql('hello');
    });
  });

  describe('save', () => {
    const initial: D = {
      '.meta': { createdAt: 0 },
      count: 0,
    };

    it('saves to file-system', async () => {
      const path = Fs.join(root, slug(), 'foo.json');
      const file = await JsonFile.get<D>(path, initial);
      expect(await Fs.exists(file.fs.path)).to.eql(false);

      file.change((d) => (d.count = 1234));

      await Time.wait(100); // NB: setup for test for modified date on save.

      const before = Time.now.timestamp;
      const res = await file.fs.save();
      const after = Time.now.timestamp;

      expect(res.error).to.eql(undefined);
      expect(await Fs.exists(file.fs.path)).to.eql(true);

      const json = (await Fs.readJson<D>(file.fs.path)).data!;
      expect(json['.meta'].modifiedAt).to.be.within(before, after);
      expect(json['.meta'].modifiedAt).to.not.eql(json['.meta'].createdAt);
      expect(json.count).to.eql(1234);
    });

    it('persists and preserves `.meta.createdAt` across saves and reloads', async () => {
      const path = Fs.join(root, slug(), 'foo-created-at.json');
      const first = await JsonFile.get<D>(path, initial);

      // Lazy write: no file on disk yet.
      expect(await Fs.exists(first.fs.path)).to.eql(false);

      const createdAt1 = first.current['.meta'].createdAt;
      expect(createdAt1).to.be.a('number');
      expect(createdAt1).to.not.eql(0);

      // First save writes the normalised createdAt to disk.
      await first.fs.save();
      expect(await Fs.exists(first.fs.path)).to.eql(true);

      const second = await JsonFile.get<D>(path, initial);
      const createdAt2 = second.current['.meta'].createdAt;
      expect(createdAt2).to.eql(createdAt1);

      // Mutate and save again.
      second.change((d) => (d.count = 999));
      await second.fs.save();

      const third = await JsonFile.get<D>(path, initial);
      const createdAt3 = third.current['.meta'].createdAt;
      expect(createdAt3).to.eql(createdAt1);
      expect(third.current.count).to.eql(999);
    });

    it('reads from file-system', async () => {
      const path = Fs.join(root, slug(), 'foo.json');
      const a = await JsonFile.get<D>(path, initial);
      expect(a.current.count).to.eql(0);

      a.change((d) => (d.count = 888));
      await a.fs.save();

      const b = await JsonFile.get<D>(path, initial);
      expect(b.current.count).to.eql(888); // NB: loaded from saved file
    });

    it('savePending: new file starts dirty, clears on save, reload starts clean, change marks dirty', async () => {
      const path = Fs.join(root, slug(), 'foo.save-pending.json');

      // 1. Brand-new file: no file on disk yet → unsaved state is "dirty".
      const first = await JsonFile.get<D>(path, initial);
      expect(await Fs.exists(first.fs.path)).to.eql(false);
      expect(first.fs.savePending).to.eql(true);

      // 2. First save writes to disk and clears the pending flag.
      await first.fs.save();
      expect(await Fs.exists(first.fs.path)).to.eql(true);
      expect(first.fs.savePending).to.eql(false);

      // 3. Reload from disk → clean (in-memory matches on-disk).
      const second = await JsonFile.get<D>(path, initial);
      expect(second.fs.savePending).to.eql(false);

      // 4. Any change after reload marks the file as dirty again.
      second.change((d) => (d.count += 1));
      expect(second.fs.savePending).to.eql(true);
    });

    it('touch: materialises a new file and starts clean (savePending = false)', async () => {
      const path = Fs.join(root, slug(), 'foo.touch.json');

      // Brand-new file with touch → should be written immediately and start clean.
      const first = await JsonFile.get<D>(path, initial, { touch: true });

      expect(await Fs.exists(first.fs.path)).to.eql(true);
      expect(first.fs.savePending).to.eql(false);

      const json = (await Fs.readJson<D>(first.fs.path)).data!;
      expect(json['.meta'].createdAt).to.be.a('number');
      expect(json['.meta'].modifiedAt).to.be.a('number');

      // Reload: still clean, same meta values.
      const second = await JsonFile.get<D>(path, initial);
      expect(second.fs.savePending).to.eql(false);
      expect(second.current['.meta'].createdAt).to.eql(json['.meta'].createdAt);
      expect(second.current['.meta'].modifiedAt).to.eql(json['.meta'].modifiedAt);
    });

    describe('error: corrupt file', () => {
      it('error: failed to read file (corrupt)', async () => {
        const path = Fs.join(root, slug(), 'foo.json');

        const a = await JsonFile.get<D>(path, initial);
        await a.fs.save();

        // Setup an initially corrupt seed file.
        const invalid = ',{not}json,💥';
        await Fs.write(path, invalid);

        let threwError = false;
        try {
          await JsonFile.get<D>(path, initial);
        } catch (error: any) {
          threwError = true;
          expect(error.name).to.eql('SyntaxError');
          expect(error.message).to.include('Unexpected token');
          expect(error.message).to.include(invalid);
        }
        expect(threwError).to.be.true;
      });

      it('does not update `.meta.modifiedAt` on save error', async () => {
        const dir = Fs.join(root, slug());
        const path = Fs.join(dir, 'foo.json');

        const file = await JsonFile.get<D>(path, initial);

        // First save: should succeed and set modifiedAt.
        await file.fs.save();
        const before = file.current['.meta'].modifiedAt;
        expect(before).to.be.a('number');

        // Break the path so subsequent save fails:
        // 1. Remove the file.
        await Fs.remove(path);
        // 2. Create a directory with the same name as the file.
        await Fs.ensureDir(path);

        // Second save: should error.
        const res = await file.fs.save();
        expect(res.error).to.not.eql(undefined);

        // Ensure modifiedAt was reverted to the previous value.
        const after = file.current['.meta'].modifiedAt;
        expect(after).to.eql(before);
      });
    });
  });
});
