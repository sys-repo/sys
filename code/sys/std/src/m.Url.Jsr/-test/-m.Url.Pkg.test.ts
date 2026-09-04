import { describe, expect, formatUrl, it, JsrUrl, print } from './common.ts';

describe('JsrUrl.Pkg', () => {
  it('web', () => {
    const url = JsrUrl.Pkg.web('@sys/std');
    expect(url).to.eql('https://jsr.io/@sys/std');
    print('JsrUrl.Pkg.web', formatUrl(url, '@sys/std'));
  });

  it('metadata', () => {
    const url = JsrUrl.Pkg.metadata('@sys/std');
    expect(url).to.eql('https://jsr.io/@sys/std/meta.json');
    print('JsrUrl.Pkg.metadata', formatUrl(url, 'meta.json'));
  });

  it('version', () => {
    const url = JsrUrl.Pkg.version('@sys/std', '0.0.42');
    expect(url).to.eql('https://jsr.io/@sys/std/0.0.42_meta.json');
    print('JsrUrl.Pkg.version', formatUrl(url, 'meta.json'));
  });

  describe('file', () => {
    it('file(name, version)', () => {
      const test = (path: string, options: { silent?: boolean } = {}) => {
        const url = JsrUrl.Pkg.file('@sys/std', '0.0.42', path);
        expect(url).to.eql('https://jsr.io/@sys/std/0.0.42/src/pkg.ts');
        if (!options.silent) print('Url.Pkg.file', formatUrl(url, path));
      };

      const silent = true;
      test('/src/pkg.ts');
      test('src/pkg.ts', { silent });
    });

    it('file(pkg)', () => {
      const pkg = { name: '@ns/foo', version: '1.2.3' };
      const res = JsrUrl.Pkg.file(pkg, 'foo/bar.ts');
      expect(res).to.eql('https://jsr.io/@ns/foo/1.2.3/foo/bar.ts');
    });
  });

  describe('ref', () => {
    it('ref(pkg, contractPath, modulePath)', () => {
      const pkg = { name: '@sys/std', version: '0.0.42' };
      const r = JsrUrl.Pkg.ref(pkg, '/src/m.gpt/t.ts', 'src/m.gpt/m.Token.ts');

      expect(r).to.eql({
        contract: 'https://jsr.io/@sys/std/0.0.42/src/m.gpt/t.ts',
        module: 'https://jsr.io/@sys/std/0.0.42/src/m.gpt/m.Token.ts',
      });

      print('JsrUrl.Pkg.ref.contract', formatUrl(r.contract, 't.ts'));
      print('JsrUrl.Pkg.ref.module', formatUrl(r.module, 'm.Token.ts'));
    });

    it('normalizes leading slashes on paths', () => {
      const pkg = { name: '@ns/foo', version: '1.2.3' };

      const a = JsrUrl.Pkg.ref(pkg, '/a/b.ts', '/x/y.ts');
      const b = JsrUrl.Pkg.ref(pkg, 'a/b.ts', 'x/y.ts');

      expect(a).to.eql(b);
      expect(a.contract).to.eql('https://jsr.io/@ns/foo/1.2.3/a/b.ts');
      expect(a.module).to.eql('https://jsr.io/@ns/foo/1.2.3/x/y.ts');
    });

    it('shape', () => {
      const pkg = { name: '@ns/bar', version: '0.0.1' };
      const r = JsrUrl.Pkg.ref(pkg, 'src/contract.ts', 'src/mod.ts');

      expect(typeof r.contract).to.eql('string');
      expect(typeof r.module).to.eql('string');
      expect(r.contract.endsWith('/src/contract.ts')).to.eql(true);
      expect(r.module.endsWith('/src/mod.ts')).to.eql(true);
    });
  });
});
