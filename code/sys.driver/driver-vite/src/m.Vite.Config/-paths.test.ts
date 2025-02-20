import { type t, c, describe, expect, it, Path, SAMPLE } from '../-test.ts';
import { Vite } from '../mod.ts';
import { ViteConfig } from './mod.ts';

describe('ViteConfig: paths', () => {
  const { brightCyan: cyan, bold } = c;

  describe('ViteConfig.paths', () => {
    it('default paths (empty params)', () => {
      const a = ViteConfig.paths();
      const b = ViteConfig.paths();
      expect(a.app.entry).to.eql('index.html');
      expect(a.app.outDir).to.eql('dist/');
      expect(a).to.not.equal(b);

      console.info();
      console.info(bold(cyan('ViteConfig.paths (default):\n')));
      console.info(a);
      console.info();
    });

    it('adjusted via params', () => {
      const a = ViteConfig.paths({ app: { entry: 'src/-entry/index.html' } });
      const b = ViteConfig.paths({ app: { outDir: 'foobar', base: './foo' } });
      const c = ViteConfig.paths({ app: { entry: '  ', outDir: '' } });
      const d = ViteConfig.paths({
        app: { entry: ' foo.html ', outDir: ' bar ', base: ' ./foo ' },
      });

      expect(a.app.entry).to.eql('src/-entry/index.html');
      expect(a.app.outDir).to.eql('dist/');
      expect(a.app.base).to.eql('./');

      expect(b.app.entry).to.eql('index.html');
      expect(b.app.outDir).to.eql('foobar');
      expect(b.app.base).to.eql('./foo');

      // NB: empty space → defaults.
      expect(c.app.entry).to.eql('index.html');
      expect(c.app.outDir).to.eql('dist/');

      // NB: space trimmed.
      expect(d.app.entry).to.eql('foo.html');
      expect(d.app.outDir).to.eql('bar');
      expect(d.app.base).to.eql('./foo');

      console.info();
      console.info(bold(cyan('ViteConfig.paths (adjusted):\n')));
      console.info(a.app);
      console.info(b.app);
      console.info(c.app);
      console.info(d.app);
      console.info();
    });

    it('cwd (variants)', () => {
      const a = ViteConfig.paths();
      const b = ViteConfig.paths({ cwd: import.meta.url });
      const c = ViteConfig.paths({ cwd: ' /foo/bar ' });
      const d = ViteConfig.paths(import.meta.url);

      expect(a.cwd).to.eql(Path.cwd());
      expect(b.cwd).to.eql(Path.dirname(Path.fromFileUrl(import.meta.url)));
      expect(c.cwd).to.eql('/foo/bar');
      expect(d.cwd).to.eql(b.cwd);
    });
  });

  describe('ViteConfig.fromFile', () => {
    it('load from file path', async () => {
      const rootDir = SAMPLE.Dirs.sample2;
      const path = Path.join(rootDir, 'vite.config.ts');
      const res = await ViteConfig.fromFile(path);

      expect(res.error).to.eql(undefined);
      expect(res.path).to.eql(Path.resolve(path));
      expect(res.exists).to.eql(true);

      const module = res.module;
      expect(module.paths?.app.entry).to.eql('src/-entry/index.html');
      expect(res.module.paths?.cwd).to.eql(Path.resolve(rootDir));
      expect(typeof module.defineConfig === 'function').to.be.true;
    });

    it('no params: load from implicit {CWD}', async () => {
      const path = Path.resolve('vite.config.ts');
      const res = await ViteConfig.fromFile();

      expect(res.path).to.eql(path);
      expect(res.module.paths?.cwd).to.eql(Path.cwd());
    });

    it('no `paths` | no `defineConfig`', async () => {
      const path = Path.fromFileUrl(import.meta.url); // NB: not a `vite.config.ts` module.
      const res = await ViteConfig.fromFile(path);
      expect(res.error).to.eql(undefined);
      expect(res.module).to.eql({});
    });

    it('loads main samples', async () => {
      const test = async (path: t.StringPath) => {
        const res = await Vite.Config.fromFile(path);
        expect(res.error).to.eql(undefined);
        expect(ViteConfig.Is.paths(res.module.paths)).to.be.true;
      };

      await test('src/-test/vite.sample-config/simple/vite.config.ts');
      await test('src/-test/vite.sample-config/custom/vite.config.ts');
    });

    it('fail: not found', async () => {
      const res = await ViteConfig.fromFile('/foo/404/vite.config.ts');
      expect(res.error?.message).to.include('Module not found at path');
      expect(res.error?.cause?.name).to.eql('TypeError');
      expect(res.module).to.eql({});
    });
  });
});
