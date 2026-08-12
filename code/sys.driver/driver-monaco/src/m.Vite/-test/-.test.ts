import { describe, expect, it } from '../../-test.ts';
import { Err, Fs } from '../common.ts';
import { hashPartsEqual } from '../m.MonacoVite/u.hash.ts';
import { inspectTree } from '../m.MonacoVite/u.tree.ts';
import { urlRoot } from '../m.MonacoVite/u.url.ts';
import { MonacoVite } from '../mod.ts';

describe('MonacoVite', () => {
  it('exports the reusable Vite integration', async () => {
    const module = await import('@sys/driver-monaco/vite');
    expect(module.MonacoVite).to.equal(MonacoVite);
  });

  it('Vite base → fixed app-relative asset route', () => {
    const bases = ['/', './', '/tools/monaco/', 'https://cdn.example/tools/monaco/'];
    expect(bases.map((base) => urlRoot(base, 'vs'))).to.eql([
      '/vs/',
      '/vs/',
      '/tools/monaco/vs/',
      '/tools/monaco/vs/',
    ]);
  });

  it('runtime parity → binds paths as well as content hashes', () => {
    const hash = 'sha256-fixture';
    const source = { 'language/worker.js': hash };
    expect(hashPartsEqual(source, { 'language/worker.js': hash })).to.eql(true);
    expect(hashPartsEqual(source, { 'renamed/worker.js': hash })).to.eql(false);
  });

  it('runtime tree with symbolic link → rejected', async () => {
    const root = (await Fs.makeTempDir({ prefix: 'sys.monaco-vite.' })).absolute;
    try {
      const target = Fs.join(root, 'target.js');
      await Fs.write(target, 'target');
      await Fs.ensureSymlink(target, Fs.join(root, 'link.js'));

      let error: unknown;
      try {
        await inspectTree(root);
      } catch (cause) {
        error = cause;
      }
      expect(Err.summary(error)).to.include('Symbolic links are not allowed');
    } finally {
      await Fs.remove(root);
    }
  });
});
