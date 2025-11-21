import { beforeAll, describe, expect, it, slug } from '../../-test.ts';
import { type t, D, Fs, getConfig } from '../common.ts';

describe('tool: __NAME__', () => {
  const root = `.tmp/test/${D.config.filename}`;

  beforeAll(async () => void (await Fs.remove(root)));

  describe('config file', () => {
    it('singleton JsonFile for the terminal/working directory', async () => {
      type Doc = t.__NAME__ConfigDoc;

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
      expect(a.fs.pending).to.eql(false);

      // Config seed is as declared in D.config.doc.
      const json = (await Fs.readJson<Doc>(path)).data!;
      expect(json.version).to.eql(D.config.doc.version);

      // Singleton semantics: same dir → same instance.
      expect(a).to.equal(b);
    });
  });
});
