import { c, describe, expect, it } from '../-test.ts';
import { Url } from './mod.ts';

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
    expect(Url.origin).to.eql('https://jsr.io');
    print('Url.origin', Url.origin);
  });

  it('Url.Pkg.metadata', () => {
    const url = Url.Pkg.metadata('@sys/std');
    expect(url).to.eql('https://jsr.io/@sys/std/meta.json');
    print('Url.Pkg.metadata', formatUrl(url, 'meta.json'));
  });

  it('Url.Pkg.version', () => {
    const url = Url.Pkg.version('@sys/std', '0.0.42');
    expect(url).to.eql('https://jsr.io/@sys/std/0.0.42_meta.json');
    print('Url.Pkg.version', formatUrl(url, 'meta.json'));
  });

  it('Url.Pkg.file', () => {
    const test = (path: string, options: { silent?: boolean } = {}) => {
      const url = Url.Pkg.file('@sys/std', '0.0.42', path);
      expect(url).to.eql('https://jsr.io/@sys/std/0.0.42/src/pkg.ts');
      if (!options.silent) print('Url.Pkg.file', formatUrl(url, path));
    };

    const silent = true;
    test('/src/pkg.ts');
    test('src/pkg.ts', { silent });
  });
});
