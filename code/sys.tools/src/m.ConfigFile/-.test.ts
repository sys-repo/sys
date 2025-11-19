import { beforeAll, describe, expect, it, Fs, slug } from '../-test.ts';
import { type t, Time } from './common.ts';
import { ConfigFile } from './mod.ts';

describe('ConfigFile', () => {
  const root = '.tmp/test/m.ConfigFile';
  beforeAll(async () => void (await Fs.remove(root)));

  type D = t.ConfigFileDoc & {};

  it('ConfigFile.default()', () => {
    const a = ConfigFile.default();
    const b = ConfigFile.default();
    expect(a).to.eql({ '.meta': { createdAt: 0 } });
    expect(a).to.not.equal(b);
  });

  describe('ConfigFile.getOrCreate', () => {
    it.only('singleton on directory', async () => {
      const dirA = Fs.join(root, slug());
      const dirB = Fs.join(root, slug());

      // NB: zero createAt date is auto-updated by at creation by the tool.
      const initial: D = { '.meta': { createdAt: 0 } };
      const a = await ConfigFile.getOrCreate<D>(dirA, initial);
      const b = await ConfigFile.getOrCreate<D>(dirB, initial, { filename: 'foo.json' });

      const now = Time.now.timestamp;
      expect(a.current['.meta'].createdAt).to.be.within(now - 10, now + 10);
      expect(b.current['.meta'].createdAt).to.be.within(now - 10, now + 10);

      expect(a.file.path).to.eql(Fs.resolve(dirA, 'config.json'));
      expect(b.file.path).to.eql(Fs.resolve(dirB, 'foo.json'));

      // Different instances based on directory.
      expect(a).to.not.equal(b);

      // Singleton instances.
      expect(await ConfigFile.getOrCreate(dirA, initial)).to.equal(a);
      expect(await ConfigFile.getOrCreate(dirB, initial)).to.equal(b);
    });
  });

  describe('getter (factory)', () => {
    it('curried settings', async () => {
      const dirA = Fs.join(root, slug());
      const dirB = Fs.join(root, slug());

      const getA = ConfigFile.getter({ '.meta': { createdAt: 0 } });
      const getB = ConfigFile.getter(() => ({ '.meta': { createdAt: 0 } }));

      const a = await getA(dirA);
      const b = await getB(dirB);

      const now = Time.now.timestamp;
      expect(a.current['.meta'].createdAt).to.be.within(now - 10, now + 10);
      expect(b.current['.meta'].createdAt).to.be.within(now - 10, now + 10);

      // Different instances based on directory.
      expect(a).to.not.equal(b);

      // Singleton instances.
      expect(await getA(dirA)).to.equal(a);
      expect(await getB(dirB)).to.equal(b);
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
});
