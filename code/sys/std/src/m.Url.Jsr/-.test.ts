import { c, describe, expect, it } from '../-test.ts';
import { JsrUrl } from './mod.ts';

describe('Jsr.Fetch.Url', () => {
  const formatUrl = (url: string, matchEnd: string) => {
    if (!url.endsWith(matchEnd)) return url;
    const left = url.slice(0, 0 - matchEnd.length);
    const right = c.bold(c.cyan(matchEnd));
    return `${left}${right}`;
  };

  const print = (title: string, url: string) => {
    url = url.replace(/https:\/\/jsr.io\//, c.gray('https://jsr.io/'));
    console.info();
    console.info(c.cyan(`${title}:`));
    console.info(`  ${url}`);
    console.info();
  };

  it('origin (url)', () => {
    expect(JsrUrl.origin).to.eql('https://jsr.io');
    print('JsrUrl.origin', JsrUrl.origin);
  });

  it('JsrUrl.Pkg.metadata', () => {
    const url = JsrUrl.Pkg.metadata('@sys/std');
    expect(url).to.eql('https://jsr.io/@sys/std/meta.json');
    print('JsrUrl.Pkg.metadata', formatUrl(url, 'meta.json'));
  });

  it('JsrUrl.Pkg.version', () => {
    const url = JsrUrl.Pkg.version('@sys/std', '0.0.42');
    expect(url).to.eql('https://jsr.io/@sys/std/0.0.42_meta.json');
    print('JsrUrl.Pkg.version', formatUrl(url, 'meta.json'));
  });

  describe('JsrUrl.Pkg.file', () => {
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
});
