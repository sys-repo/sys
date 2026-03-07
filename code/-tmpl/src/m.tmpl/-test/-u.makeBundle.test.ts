import { describe, expect, expectError, Fs, it } from '../../-test.ts';
import { json } from '../-bundle.ts';
import { assertTemplateSourceClean, isAllowedTemplateBundlePath } from '../u.makeBundle.ts';

describe('m.tmpl/u.makeBundle', () => {
  it('isAllowedTemplateBundlePath excludes generated folders', () => {
    expect(isAllowedTemplateBundlePath('tmpl.repo/.tmpl.ts')).to.eql(true);
    expect(isAllowedTemplateBundlePath('tmpl.repo/code/mod.ts')).to.eql(true);
    expect(isAllowedTemplateBundlePath('tmpl.repo/node_modules/foo.js')).to.eql(false);
    expect(isAllowedTemplateBundlePath('tmpl.repo/.deno/cache.bin')).to.eql(false);
    expect(isAllowedTemplateBundlePath('tmpl.repo/deno.lock')).to.eql(false);
    expect(isAllowedTemplateBundlePath('tmpl.repo/dist/index.js')).to.eql(false);
    expect(isAllowedTemplateBundlePath('tmpl.repo/coverage/index.html')).to.eql(false);
    expect(isAllowedTemplateBundlePath('tmpl.repo/.tmp/file.txt')).to.eql(false);
    expect(isAllowedTemplateBundlePath('other/file.txt')).to.eql(false);
  });

  it('assertTemplateSourceClean fails when forbidden dirs exist', async () => {
    const tmp = await Fs.makeTempDir({ prefix: 'tmpl.bundle.clean-' });
    const root = tmp.absolute;
    await Fs.ensureDir(Fs.join(root, 'tmpl.repo', 'node_modules'));
    await Fs.write(Fs.join(root, 'tmpl.repo', 'deno.lock'), '');
    await Fs.ensureDir(Fs.join(root, 'tmpl.m.mod'));

    await expectError(
      () => assertTemplateSourceClean(root),
      'Template source contains forbidden generated directories',
    );
  });

  it('bundles the internal package scaffold under the public pkg root', () => {
    expect(Object.keys(json).some((key) => key.startsWith('pkg/'))).to.eql(true);
    expect(Object.keys(json).some((key) => key.startsWith('pkg.deno/'))).to.eql(false);
  });
});
