import { type t, c, describe, expect, it, Path, SAMPLE } from '../-test.ts';
import { Vite } from '../mod.ts';
import { Is } from './m.Is.ts';
import { ViteConfig } from './mod.ts';
import { toAlias, toAliasRegex } from './u.alias.ts';

describe('ViteConfig', () => {
  const { brightCyan: cyan, bold } = c;

  it('API', () => {
    expect(Vite.Config).to.equal(ViteConfig);
    expect(ViteConfig.Is).to.equal(Is);
    expect(ViteConfig.alias).to.equal(toAlias);
  });

  describe('ViteConfig.alias (rollup)', () => {
    it('toAliasRegex', () => {
      const jsr = toAliasRegex('jsr', 'foobar');
      const npm = toAliasRegex('npm', 'foobar');

      const test = (regex: RegExp, input: string, expected: boolean) => {
        const match = regex.exec(input);
        expect(!!match).to.eql(expected);
      };

      test(jsr, 'jsr:foobar@>=1.2.3-alpha.1/foobar', true);
      test(jsr, 'jsr:foobar@>=1.2.3-alpha.1/foo/file.css', true);
      test(jsr, 'jsr:foobar/foo/file.css', true);

      test(npm, 'npm:foobar@1', true);
      test(npm, 'npm:foobar@~1.2.3', true);
      test(npm, 'npm:foobar@^1.2.3-alpha.1', true);
      test(npm, 'npm:foobar@>=1.2.3-alpha.1', true);
      test(npm, 'npm:foobar@>=1.2.3-alpha.1/foobar', true);
      test(npm, 'npm:foobar@1/foo/bar', true);
      test(npm, 'npm:foobar/foo/bar', true);

      test(npm, ' npm:foobar@1.2.3', false);
      test(npm, 'npm:foobar@1.2 ', false);
    });

    describe('toAlias', () => {
      it('structure', () => {
        const jsr = toAlias('jsr', ' foobar ');
        const npm = toAlias('npm', ' @scope/foo ');
        expect(jsr.customResolver).to.eql(undefined);
        expect(npm.customResolver).to.eql(undefined);

        expect(jsr.find).to.eql(toAliasRegex('jsr', 'foobar'));
        expect(jsr.replacement).to.eql('foobar$1');

        expect(npm.find).to.eql(toAliasRegex('npm', '@scope/foo'));
        expect(npm.replacement).to.eql('@scope/foo$1');
      });

      const test = (
        registry: t.CodeRegistry,
        moduleName: string,
        input: string,
        expected: string,
      ) => {
        const alias = toAlias(registry, moduleName);
        const res = input.replace(alias.find, alias.replacement);
        expect(res).to.eql(expected);
      };

      it('replace module without version but not subpath', () => {
        test('npm', '@vidstack/react', 'npm:@vidstack/react', '@vidstack/react');
        test('npm', 'foo', 'npm:foo', 'foo');
        test('jsr', '@sys/tmp', 'jsr:@sys/tmp', '@sys/tmp');
      });

      it('replace module with version but not subpath', () => {
        test('npm', '@vidstack/react', 'npm:@vidstack/react@1.2.3', '@vidstack/react');
        test('npm', 'foo', 'npm:foo@~1', 'foo');
        test('npm', 'foo', 'npm:foo@1.2.3-alpha.1', 'foo');
        test('jsr', '@sys/tmp', 'jsr:@sys/tmp@>=0.1.2', '@sys/tmp');
      });

      it('replace module with version and subpath', () => {
        test('npm', '@vidstack/react', 'npm:@vidstack/react@1.2.3/a/b', '@vidstack/react/a/b');
        test('npm', 'foo', 'npm:foo@1.2.3/a/b', 'foo/a/b');
        test('jsr', '@sys/tmp', 'jsr:@sys/tmp@1.2.3/foo', '@sys/tmp/foo');
        test('jsr', '@sys/tmp', 'jsr:@sys/tmp@1.2.3/foo/bar.z', '@sys/tmp/foo/bar.z');
      });

      it('replace module without version but with subpath', () => {
        test('npm', '@vidstack/react', 'npm:@vidstack/react/a/b', '@vidstack/react/a/b');
        test('npm', 'foo', 'npm:foo/a/b', 'foo/a/b');
        test('jsr', '@sys/tmp', 'jsr:@sys/tmp/a/b', '@sys/tmp/a/b');
      });
    });
  });

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

    it('adjusted', () => {
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

      expect(a.cwd).to.eql(Path.cwd());
      expect(b.cwd).to.eql(Path.dirname(Path.fromFileUrl(import.meta.url)));
      expect(c.cwd).to.eql('/foo/bar');
    });
  });

  describe('ViteConfig.fromFile', () => {
    it('load from file path', async () => {
      const path = Path.join(SAMPLE.Dirs.b, 'vite.config.ts');
      const res = await ViteConfig.fromFile(path);
      expect(res.error).to.eql(undefined);
      expect(res.path).to.eql(Path.resolve(path));
      expect(res.module.paths?.app.entry).to.eql('src/-entry/index.html');
      expect(typeof res.module.defineConfig === 'function').to.be.true;
    });

    it('no params: load from implicit {CWD}', async () => {
      const path = Path.resolve('vite.config.ts');
      const res = await ViteConfig.fromFile();
      expect(res.path).to.eql(path);
      expect(typeof res.module.defineConfig === 'function').to.be.true;
      expect((await import(path)).default).to.eql(res.module.defineConfig);
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

      await test('src/-test/vite.sample-config/config.simple.ts');
      await test('src/-test/vite.sample-config/config.custom.ts');
    });

    it('fail: not found', async () => {
      const res = await ViteConfig.fromFile('/foo/404/vite.config.ts');
      expect(res.error?.message).to.include('Module not found at path');
      expect(res.error?.cause?.name).to.eql('TypeError');
      expect(res.module).to.eql({});
    });
  });

  describe('ViteConfig.Is', () => {
    it('Is.path', () => {
      const test = (input: any, expected: boolean) => {
        const res = ViteConfig.Is.paths(input);
        expect(res).to.eql(expected, input);
      };
      const NON = ['', 123, true, null, undefined, BigInt(0), Symbol('foo'), {}, []];
      NON.forEach((value) => test(value, false));

      test(ViteConfig.paths(), true);
      test(ViteConfig.paths({ app: { entry: 'src/-entry/index.html' } }), true);
    });
  });
});
