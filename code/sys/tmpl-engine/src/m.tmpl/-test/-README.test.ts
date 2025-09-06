import { type t, Fs, Path, describe, expect, it } from '../../-test.ts';
import { TmplEngine } from '../mod.ts';

/**
 * Samples the make sure the README code is in working order.
 */
describe('README', () => {
  describe('Bundle folder → JSON artifact', () => {});

  it('code sample', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'tmpl-readme-bundle-' });

    const srcDir = './src/-test/sample-1';
    const targetFile = Path.join(tmp.absolute, '-bundle.json');
    const res = await TmplEngine.FileMap.bundle(srcDir, targetFile);

    // Illustrative assertions:
    expect(res.file).to.eql(Path.resolve(targetFile));
    expect(res.count).to.eql(Object.keys(res.fileMap).length);
    expect(await Fs.exists(targetFile)).to.eql(true);

    // Round trip sanity:
    const json = (await Fs.readText(targetFile)).data ?? '';
    const roundTripped = JSON.parse(json) as t.FileMap;
    expect(Object.keys(roundTripped)).to.eql(Object.keys(res.fileMap));
  });
});
