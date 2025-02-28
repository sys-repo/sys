import { c, describe, expect, it, Path } from '../-test.ts';
import { ViteConfig } from './mod.ts';

describe('ViteConfig.paths', () => {
  const { brightCyan: cyan, bold } = c;

  describe('[ViteConfigPaths]: data structure', () => {
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
});
