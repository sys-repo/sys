import { beforeAll, describe, expect, it, slug } from '../-test.ts';
import { Fs, type t, Time } from './common.ts';
import { JsonFile } from './mod.ts';

describe('ConfigFile', () => {
  const root = '.tmp/test/m.ConfigFile';
  beforeAll(async () => void (await Fs.remove(root)));

  type D = t.JsonFileDoc & { msg?: string; count: number };

  it('API', async () => {
    const m = await import('@sys/fs/file');
    expect(m.JsonFile).to.equal(JsonFile);
  });

  it('ConfigFile.default()', () => {
    const a = JsonFile.default();
    const b = JsonFile.default();
    expect(a).to.eql({ '.meta': { createdAt: 0 } });
    expect(a).to.not.equal(b);
  });

  describe('get', () => {
    it('getOrCreate', async () => {
      const dir = Fs.join(root, slug());
      const pathA = Fs.join(dir, 'foo.json');
      const pathB = Fs.join(dir, 'bar.json');

      // NB: zero `createdAt` date is auto-updated by at creation by the tool.
      const initial: D = { '.meta': { createdAt: 0 }, count: 0 };
      const a = await JsonFile.getOrCreate<D>(pathA, initial);
      const b = await JsonFile.getOrCreate<D>(pathB, initial);

      const now = Time.now.timestamp;
      expect(a.current['.meta'].createdAt).to.be.within(now - 10, now + 10);
      expect(b.current['.meta'].createdAt).to.be.within(now - 10, now + 10);

      expect(a.fs.path).to.eql(Fs.resolve(pathA));
      expect(b.fs.path).to.eql(Fs.resolve(pathB));

      // Different instances based on directory.
      expect(a).to.not.equal(b);
    });

    it('getter', async () => {
      const dir = Fs.join(root, slug());
      const initial = { '.meta': { createdAt: 0 }, count: 0 };
      const getA = JsonFile.getter<D>({ filename: 'foo.json' }, initial);
      const getB = JsonFile.getter<D>({ filename: 'bar.json' }, () => initial);

      const a = await getA(dir);
      const b = await getB(dir);

      const now = Time.now.timestamp;
      expect(a.current['.meta'].createdAt).to.be.within(now - 10, now + 10);
      expect(b.current['.meta'].createdAt).to.be.within(now - 10, now + 10);

      expect(initial['.meta'].createdAt).to.eql(0); // NB: ensure the initial input was not mutated.

      // Different instances based on directory.
      expect(a).to.not.equal(b);
    });

    it('extend fields including .meta', async () => {
      type T = t.JsonFileDoc & {
        '.meta': t.JsonFileDoc['.meta'] & { tmp: number };
        foo: string;
      };

      const dir = Fs.join(root, slug());
      const initial: T = { '.meta': { createdAt: 0, tmp: 123 }, foo: 'hello' };
      const fn = JsonFile.getter<T>({ filename: 'my-file.json' }, initial);
      const file = await fn(dir);

      const now = Time.now.timestamp;
      expect(file.current['.meta'].createdAt).to.be.within(now - 10, now + 10);
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
      const file = await JsonFile.getOrCreate<D>(path, initial);
      expect(await Fs.exists(file.fs.path)).to.eql(false);

      file.change((d) => (d.count = 1234));

      await Time.wait(100); // NB: setup for test for modified date on save.
      const res = await file.fs.save();

      expect(res.error).to.eql(undefined);
      expect(await Fs.exists(file.fs.path)).to.eql(true);

      const json = (await Fs.readJson<D>(file.fs.path)).data!;
      const now = Time.now.timestamp;
      expect(json['.meta'].modifiedAt).to.be.within(now - 10, now + 10);
      expect(json['.meta'].modifiedAt).to.not.eql(json['.meta'].createdAt);
      expect(json.count).to.eql(1234);
    });

    it('reads from file-system', async () => {
      const path = Fs.join(root, slug(), 'foo.json');
      const a = await JsonFile.getOrCreate<D>(path, initial);
      expect(a.current.count).to.eql(0);

      a.change((d) => (d.count = 888));
      await a.fs.save();

      const b = await JsonFile.getOrCreate<D>(path, initial);
      expect(b.current.count).to.eql(888); // NB: loaded from saved file
    });

    describe('error: corrupt file', () => {
      it('error: failed to read file (corrupt)', async () => {
        const path = Fs.join(root, slug(), 'foo.json');

        const a = await JsonFile.getOrCreate<D>(path, initial);
        await a.fs.save();

        // Setup an initially corrupt seed file.
        const invalid = ',{not}json,💥';
        await Fs.write(path, invalid);

        let threwError = false;
        try {
          await JsonFile.getOrCreate<D>(path, initial);
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

        const file = await JsonFile.getOrCreate<D>(path, initial);

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
