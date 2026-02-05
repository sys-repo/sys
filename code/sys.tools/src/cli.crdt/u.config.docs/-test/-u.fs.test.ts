import { describe, expect, Fs, it, pkg } from '../../../-test.ts';
import { CrdtDocsFs } from '../u.fs.ts';
import { CrdtDocSchema } from '../u.schema.ts';
import { withTmpDir } from '../../-test/-fixtures.ts';

describe('CrdtDocsFs', () => {
  it('dir uses pkg.name', () => {
    expect(CrdtDocsFs.dir).to.eql(`-config/${pkg.name.replace('/', '.')}.crdt.docs`);
  });

  it('fileOf returns <dir>/<id>.yaml', () => {
    const id = '28pHMgPCrMR82eexLbPzvXq3RnSy';
    expect(CrdtDocsFs.fileOf(id)).to.eql(`${CrdtDocsFs.dir}/${id}.yaml`);
  });

  it('writeDoc + readYaml roundtrip', async () => {
    await withTmpDir(async (tmp: string) => {
      const id = 'pz1U8r3FH2ubPjnBzTMtFB8Yaaw';
      const doc = CrdtDocSchema.initial(id);
      const path = Fs.join(tmp, CrdtDocsFs.fileOf(id));

      await CrdtDocsFs.writeDoc(path, doc);
      const res = await CrdtDocsFs.readYaml(path);

      expect(res.ok).to.eql(true);
      if (res.ok) expect(res.doc.id).to.eql(id);
    });
  });
});
