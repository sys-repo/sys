import { describe, expect, it } from '../../-test.ts';
import { Err, Fs } from '../common.ts';
import { hashPartsEqual } from '../m.MonacoVite/u.hash.ts';
import { resolveSourcePath } from '../m.MonacoVite/u.source.ts';
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

  it('development source path → bounded regular runtime file', async () => {
    const root = (await Fs.makeTempDir({ prefix: 'sys.monaco-vite-source.' })).absolute;
    try {
      const packageRoot = Fs.join(root, 'package');
      const runtimeDir = Fs.join(packageRoot, 'min', 'vs');
      const outside = Fs.join(root, 'outside.js');
      await Fs.ensureDir(Fs.join(runtimeDir, 'language'));
      await Fs.write(Fs.join(runtimeDir, 'loader.js'), 'loader');
      await Fs.write(Fs.join(runtimeDir, '..worker.js'), 'worker');
      await Fs.write(outside, 'outside');
      await Fs.ensureSymlink(outside, Fs.join(runtimeDir, 'language', 'link.js'));

      const source = {
        packageRoot: Fs.resolve(packageRoot),
        runtimeDir: Fs.resolve(runtimeDir),
        version: '0.0.0',
      };
      expect(await resolveSourcePath(source, 'loader.js')).to.eql(
        await Fs.realPath(Fs.join(runtimeDir, 'loader.js')),
      );
      expect(await resolveSourcePath(source, '..worker.js')).to.eql(
        await Fs.realPath(Fs.join(runtimeDir, '..worker.js')),
      );
      expect(await resolveSourcePath(source, '../outside.js')).to.eql(undefined);
      expect(await resolveSourcePath(source, '/outside.js')).to.eql(undefined);
      expect(await resolveSourcePath(source, 'language/link.js')).to.eql(undefined);
      expect(await resolveSourcePath(source, 'missing.js')).to.eql(undefined);
    } finally {
      await Fs.remove(root);
    }
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
