import { beforeAll, describe, expect, it, slug } from '../../-test.ts';
import { Fs, type t, Time } from '../common.ts';
import { JsonFile } from '../mod.ts';

describe('JsonFile.Singleton', () => {
  const root = '.tmp/test/m.JsonFile.Singleton';
  beforeAll(async () => void (await Fs.remove(root)));

  type D = t.JsonFileDoc & { msg?: string; count: number };
  const initial: D = { '.meta': { createdAt: 0 }, count: 0 };

  it('throws when no instance exists and no initial is provided', async () => {
    const dir = Fs.join(root, slug());
    const path = Fs.join(dir, 'foo.json');

    let threw = false;
    try {
      await JsonFile.Singleton.get<D>(path);
    } catch (error: any) {
      threw = true;
      expect(error.message).to.include('no instance');
      expect(error.message).to.include(path);
    }
    expect(threw).to.eql(true);
  });

  it('returns the same instance for the same path (singleton)', async () => {
    const dir = Fs.join(root, slug());
    const path = Fs.join(dir, 'foo.json');

    const a = await JsonFile.Singleton.get<D>(path, initial);
    const b = await JsonFile.Singleton.get<D>(path, {
      '.meta': { createdAt: 0 },
      count: 999,
      msg: 'ignored',
    });

    // Identity: same handle.
    expect(a).to.equal(b);

    // Mutating via one handle is visible via the other.
    const before = a.current.count;
    a.change((d) => (d.count = before + 1));
    expect(b.current.count).to.eql(before + 1);
  });

  it('different paths yield different instances', async () => {
    const dir = Fs.join(root, slug());
    const pathA = Fs.join(dir, 'a.json');
    const pathB = Fs.join(dir, 'b.json');

    const a = await JsonFile.Singleton.get<D>(pathA, initial);
    const b = await JsonFile.Singleton.get<D>(pathB, initial);

    expect(a).to.not.equal(b);
    expect(a.fs.path).to.eql(Fs.resolve(pathA));
    expect(b.fs.path).to.eql(Fs.resolve(pathB));
  });

  it('keys/entries reflect the singleton pool', async () => {
    JsonFile.Singleton.clear();

    const dir = Fs.join(root, slug());
    const pathA = Fs.join(dir, 'a.json');
    const pathB = Fs.join(dir, 'b.json');

    const a = await JsonFile.Singleton.get<D>(pathA, initial);
    const b = await JsonFile.Singleton.get<D>(pathB, initial);

    const keys = JsonFile.Singleton.keys();
    const entries = JsonFile.Singleton.entries();

    const resolvedA = Fs.resolve(pathA);
    const resolvedB = Fs.resolve(pathB);

    expect(keys).to.include(resolvedA);
    expect(keys).to.include(resolvedB);

    // entries() shape and content
    const pathsFromEntries = entries.map(([p]) => p);
    expect(pathsFromEntries).to.include(resolvedA);
    expect(pathsFromEntries).to.include(resolvedB);

    const filesFromEntries = entries.map(([, file]) => file);
    expect(filesFromEntries).to.include(a);
    expect(filesFromEntries).to.include(b);
  });

  it('clear() empties the singleton pool', async () => {
    const dir = Fs.join(root, slug());
    const path = Fs.join(dir, 'foo.json');

    await JsonFile.Singleton.get<D>(path, initial);
    expect(JsonFile.Singleton.keys().length).to.be.greaterThan(0);

    JsonFile.Singleton.clear();
    expect(JsonFile.Singleton.keys().length).to.eql(0);

    let threw = false;
    try {
      await JsonFile.Singleton.get<D>(path);
    } catch {
      threw = true;
    }
    expect(threw).to.eql(true);
  });

  it('createdAt is stable across singleton retrievals, modifiedAt updates on save', async () => {
    const dir = Fs.join(root, slug());
    const path = Fs.join(dir, 'foo.json');

    JsonFile.Singleton.clear();
    const file = await JsonFile.Singleton.get<D>(path, initial);

    const createdAt = file.current['.meta'].createdAt;
    expect(createdAt).to.be.a('number');

    expect(file.current['.meta'].modifiedAt).to.eql(undefined);

    await Time.wait(10);
    await file.fs.save();

    const afterSave = file.current['.meta'].modifiedAt;
    expect(afterSave).to.be.a('number');
    expect(afterSave).to.be.greaterThan(createdAt);

    const again = await JsonFile.Singleton.get<D>(path);
    expect(again).to.equal(file);
    expect(again.current['.meta'].createdAt).to.eql(createdAt);
    expect(again.current['.meta'].modifiedAt).to.eql(afterSave);
  });
});
