import { beforeAll, describe, expect, it, slug } from '../../-test.ts';
import { type t, Fs, getConfig, D } from '../common.ts';

describe('cli.crdt', () => {
  const root = '.tmp/test/cli.crdt.getConfig';

  beforeAll(async () => void (await Fs.remove(root)));

  describe('config file', () => {
    it('returns a singleton JsonFile config for the directory', async () => {
      type Doc = t.CrdtConfigDoc;

      const dir = Fs.join(root, slug());
      const path = Fs.join(dir, D.config.filename);

      const a = await getConfig(dir);
      const b = await getConfig(dir);

      // JsonFile handle + shape.
      expect(a).to.be.ok;
      expect(a.current).to.be.an('object');
      expect(a.fs.path).to.eql(Fs.resolve(path));

      // touch: file is materialised immediately and starts clean.
      expect(await Fs.exists(path)).to.eql(true);
      expect(a.fs.savePending).to.eql(false);

      // Config seed is as declared in D.config.doc.
      const json = (await Fs.readJson<Doc>(path)).data!;
      expect(json.version).to.eql(D.config.doc.version);

      // Singleton semantics: same dir → same instance.
      expect(a).to.equal(b);
    });
  });
});
