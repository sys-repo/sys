import { beforeAll, describe, expect, it, slug } from '../../-test.ts';
import { type t, D, Fs } from '../common.ts';
import { Config } from '../u.config.ts';

describe('tool: Deploy', () => {
  const root = `.tmp/test/${D.Config.filename}`;

  beforeAll(async () => void (await Fs.remove(root)));

  describe('config file', () => {
    it('singleton JsonFile for the terminal/working directory', async () => {
      type Doc = t.DeployTool.Config.Doc;

      const dir = Fs.join(root, slug());
      const path = Config.path(dir, D.Config.filename);

      const a = await Config.get(dir);
      const b = await Config.get(dir);

      // JsonFile handle + shape.
      expect(a).to.be.ok;
      expect(a.current).to.be.an('object');
      expect(a.fs.path).to.eql(Fs.resolve(path));

      // touch: file is materialised immediately and starts clean.
      expect(await Fs.exists(path)).to.eql(true);
      expect(a.fs.pending).to.eql(false);

      // Config seed is as declared in D.config.doc.
      const json = (await Fs.readJson<Doc>(path)).data!;
      expect(json.name).to.eql(D.Config.doc.name);

      // Singleton semantics: same dir → same instance.
      expect(a).to.equal(b);
    });
  });
});
