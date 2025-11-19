import { beforeAll, describe, expect, Fs, it, slug } from '../-test.ts';
import { type t, Time } from './common.ts';
import { ConfigFile } from '@sys/tools/config-file';

describe('ConfigFile', () => {
  const root = '.tmp/test/m.ConfigFile';
  beforeAll(async () => void (await Fs.remove(root)));

  type D = t.ConfigFileDoc & { msg?: string; count: number };

  it('ConfigFile.default()', () => {
    const a = ConfigFile.default();
    const b = ConfigFile.default();
    expect(a).to.eql({ '.meta': { createdAt: 0 } });
    expect(a).to.not.equal(b);
  });

  describe('ConfigFile.getOrCreate', () => {
    it('getOrCreate', async () => {
      const dirA = Fs.join(root, slug());
      const dirB = Fs.join(root, slug());

      // NB: zero createAt date is auto-updated by at creation by the tool.
      const initial: D = { '.meta': { createdAt: 0 }, count: 0 };
      const a = await ConfigFile.getOrCreate<D>(dirA, initial);
      const b = await ConfigFile.getOrCreate<D>(dirB, initial, { filename: 'foo.json' });

      const now = Time.now.timestamp;
      expect(a.current['.meta'].createdAt).to.be.within(now - 10, now + 10);
      expect(b.current['.meta'].createdAt).to.be.within(now - 10, now + 10);

      expect(a.file.path).to.eql(Fs.resolve(dirA, 'config.json'));
      expect(b.file.path).to.eql(Fs.resolve(dirB, 'foo.json'));

      // Different instances based on directory.
      expect(a).to.not.equal(b);
    });
  });

  describe('getter (factory)', () => {
    it('curried settings', async () => {
      const dirA = Fs.join(root, slug());
      const dirB = Fs.join(root, slug());

      const getA = ConfigFile.getter<D>({ '.meta': { createdAt: 0 }, count: 0 });
      const getB = ConfigFile.getter<D>(() => ({ '.meta': { createdAt: 0 }, count: 0 }));

      const a = await getA(dirA);
      const b = await getB(dirB);

      const now = Time.now.timestamp;
      expect(a.current['.meta'].createdAt).to.be.within(now - 10, now + 10);
      expect(b.current['.meta'].createdAt).to.be.within(now - 10, now + 10);

      // Different instances based on directory.
      expect(a).to.not.equal(b);
    });

    it('extend fields including .meta', async () => {
      type T = t.ConfigFileDoc & {
        '.meta': t.ConfigFileDoc['.meta'] & { tmp: number };
        foo: string;
      };

      const dir = Fs.join(root, slug());
      const fn = ConfigFile.getter<T>({ '.meta': { createdAt: 0, tmp: 123 }, foo: 'hello' });
      const config = await fn(dir);

      const now = Time.now.timestamp;
      expect(config.current['.meta'].createdAt).to.be.within(now - 10, now + 10);
      expect(config.current['.meta'].tmp).to.eql(123);
      expect(config.current.foo).to.eql('hello');
    });
  });

  describe('save', () => {
    it('saves to file-system', async () => {
      const dir = Fs.join(root, slug());
      const get = ConfigFile.getter<D>({ '.meta': { createdAt: 0 }, count: 0 });

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
      const get = ConfigFile.getter<D>({ '.meta': { createdAt: 0 }, count: 0 });

      const a = await get(dir);
      expect(a.current.count).to.eql(0);

      a.change((d) => (d.count = 888));
      await a.file.save();

      const b = await get(dir);
      expect(b.current.count).to.eql(888);
    });
  });
});
