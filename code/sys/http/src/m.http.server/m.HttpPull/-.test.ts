import { describe, expect, it } from '../../-test.ts';
import { PullMap } from './u.Map.ts';

const U = (s: string) => new URL(s);

describe(`HttpPull`, () => {
  describe('Map', () => {
    describe('urlToPath', () => {
      it('mirrors pathname by default (no leading slash)', () => {
        const out = PullMap.urlToPath(U('https://domain.com/path/sample/pkg/m.X.js'));
        expect(out).to.eql('path/sample/pkg/m.X.js');
      });

      it('rebase: strips relativeTo on segment boundary', () => {
        const out = PullMap.urlToPath(U('https://domain.com/path/sample/pkg/m.X.js'), {
          relativeTo: '/path/sample',
        });
        expect(out).to.eql('pkg/m.X.js');
      });

      it('rebase: exact-match → empty → uses emptyBasename (default "index")', () => {
        const out = PullMap.urlToPath(U('https://domain.com/path/sample/'), {
          relativeTo: '/path/sample',
        });
        expect(out).to.eql('index');
      });

      it('rebase: exact-match with custom emptyBasename', () => {
        const out = PullMap.urlToPath(U('https://domain.com/path/sample/'), {
          relativeTo: '/path/sample',
          emptyBasename: 'root',
        });
        expect(out).to.eql('root');
      });

      it('includeHost prefixes host (with port if present)', () => {
        const out = PullMap.urlToPath(U('https://domain.com:4444/path/sample/pkg/m.X.js'), {
          includeHost: true,
        });
        expect(out).to.eql('domain.com:4444/path/sample/pkg/m.X.js');
      });

      it('includeHost + rebase', () => {
        const out = PullMap.urlToPath(U('https://domain.com/path/sample/pkg/m.X.js'), {
          includeHost: true,
          relativeTo: 'path/sample',
        });
        expect(out).to.eql('domain.com/pkg/m.X.js');
      });

      it('mapPath wins over relativeTo/includeHost', () => {
        const out = PullMap.urlToPath(U('https://domain.com/any/path.js'), {
          relativeTo: 'any',
          includeHost: true,
          mapPath: () => 'custom/out.js',
        });
        expect(out).to.eql('custom/out.js');
      });

      it('never returns empty string', () => {
        const out = PullMap.urlToPath(U('https://domain.com/'));
        expect(out.length > 0).to.eql(true);
      });

      it('defensively POSIX-normalizes mapPath output (backslashes)', () => {
        const out = PullMap.urlToPath(U('https://domain.com/one/two'), {
          mapPath: () => '\\one\\two',
        });
        expect(out).to.eql('one/two');
      });
    });

    describe('rebase', () => {
      it('exact match → empty', () => {
        expect(PullMap.rebase('path/sample', 'path/sample')).to.eql('');
        expect(PullMap.rebase('a/b', 'a/b')).to.eql('');
      });

      it('boundary-aware prefix removal', () => {
        expect(PullMap.rebase('path/sample/pkg/m.X.js', 'path/sample')).to.eql('pkg/m.X.js');
        expect(PullMap.rebase('a/b/c/d', 'a/b')).to.eql('c/d');
      });

      it('non-boundary prefix is not removed', () => {
        expect(PullMap.rebase('path/sampler/pkg.js', 'path/sample')).to.eql('path/sampler/pkg.js');
        expect(PullMap.rebase('abc/def', 'a')).to.eql('abc/def');
      });

      it('empty base is a no-op', () => {
        expect(PullMap.rebase('path/sample', '')).to.eql('path/sample');
      });

      it('base longer than pathname → no-op', () => {
        expect(PullMap.rebase('a/b', 'a/b/c')).to.eql('a/b');
      });

      it('base equal to first segment only removes on boundary', () => {
        expect(PullMap.rebase('abc/def', 'abc')).to.eql('def'); // boundary
        expect(PullMap.rebase('abcdef/ghi', 'abc')).to.eql('abcdef/ghi'); // not a boundary
      });
    });

    describe('baseFrom', () => {
      it('returns empty string when input is undefined', () => {
        expect(PullMap.baseFrom(undefined)).to.eql('');
      });

      it('handles string paths (leading slash removed)', () => {
        expect(PullMap.baseFrom('/path/sample')).to.eql('path/sample');
        expect(PullMap.baseFrom('path/sample')).to.eql('path/sample');
      });

      it('handles URL objects (uses pathname)', () => {
        const url = new URL('https://domain.com/path/sample/');
        expect(PullMap.baseFrom(url)).to.eql('path/sample/');
      });

      it('converts backslashes to POSIX slashes', () => {
        expect(PullMap.baseFrom('\\path\\sample')).to.eql('path/sample');
      });

      it('treats invalid URL-looking strings as plain input', () => {
        // "http:::/bad" will throw URL parse error, caught and passed to relativePosix
        expect(PullMap.baseFrom('http:::/bad')).to.eql('http:::/bad');
      });

      it('removes leading slashes but preserves internal ones', () => {
        expect(PullMap.baseFrom('///a//b///c')).to.eql('a//b///c');
      });
    });
  });
});
