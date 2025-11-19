import { beforeAll, describe, expect, it, slug } from '../-test.ts';
import { type t, Time, Fs } from './common.ts';
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

      expect(a.file.path).to.eql(Fs.resolve(pathA));
      expect(b.file.path).to.eql(Fs.resolve(pathB));

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
      const config = await fn(dir);

      const now = Time.now.timestamp;
      expect(config.current['.meta'].createdAt).to.be.within(now - 10, now + 10);
      expect(config.current['.meta'].tmp).to.eql(123);
      expect(config.current.foo).to.eql('hello');
    });
  });

  describe('save', () => {
    const initial: D = { '.meta': { createdAt: 0 }, count: 0 };

    it('saves to file-system', async () => {
      const dir = Fs.join(root, slug());
      const get = JsonFile.getter<D>({ filename: 'foo.json' }, initial);

      const config = await get(dir);
      expect(await Fs.exists(config.file.path)).to.eql(false);

      config.change((d) => (d.count = 1234));

      await Time.wait(100); // NB: setup for test for modified date on save.
      const res = await config.file.save();

      expect(res.error).to.eql(undefined);
      expect(await Fs.exists(config.file.path)).to.eql(true);

      const json = (await Fs.readJson<D>(config.file.path)).data!;
      const now = Time.now.timestamp;
      expect(json['.meta'].modifiedAt).to.be.within(now - 10, now + 10);
      expect(json['.meta'].modifiedAt).to.not.eql(json['.meta'].createdAt);
      expect(json.count).to.eql(1234);
    });

    it('reads from file-system', async () => {
      const dir = Fs.join(root, slug());
      const get = JsonFile.getter<D>({ filename: 'foo.json' }, initial);

      const a = await get(dir);
      expect(a.current.count).to.eql(0);

      a.change((d) => (d.count = 888));
      await a.file.save();

      const b = await get(dir);
      expect(b.current.count).to.eql(888);
    });

    describe('error: corrupt file', () => {
      it('error: failed to read file (corrupt)', async () => {
        const dir = Fs.join(root, slug());
        const get = JsonFile.getter<D>({ filename: 'foo.json' }, initial);

        // Setup corrupt file.
        const invalid = ',{not}json,💥';
        await Fs.write(Fs.join(dir, 'foo.json'), invalid);

        let threwError = false;
        try {
          await get(dir);
        } catch (error: any) {
          threwError = true;
          expect(error.name).to.eql('SyntaxError');
          expect(error.message).to.include('Unexpected token');
          expect(error.message).to.include(invalid);
        }

        expect(threwError).to.be.true;
      });
    });
  });
});
