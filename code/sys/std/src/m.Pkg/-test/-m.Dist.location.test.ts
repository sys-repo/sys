import { type t, describe, it, expect, expectTypeOf } from '../../-test.ts';
import { Dist } from '../mod.ts';
import { expectUrl, expectDir } from './u.ts';

describe('Pkg.Dist.location', () => {
  it('URL → PkgDistLocationUrl (nested path)', () => {
    const href = 'https://example.com/sys/driver.module/dist.json' as t.StringUrl;

    const loc = Dist.location(href);
    const urlLoc = expectUrl(loc);

    expect(urlLoc.kind).to.eql('url');
    expect(urlLoc.href).to.eql('https://example.com/sys/driver.module/dist.json');
    expect(urlLoc.origin).to.eql('https://example.com');
    expect(urlLoc.host).to.eql('example.com');
    expect(urlLoc.protocol).to.eql('https:');
    expect(urlLoc.pathname).to.eql('/sys/driver.module/dist.json');

    expect(urlLoc.root).to.eql('/sys/driver.module');
    expect(urlLoc.segments).to.eql(['sys', 'driver.module']);
    expect(urlLoc.is.root).to.eql(false);

    // Type-level: URL path usage yields the URL variant.
    expectTypeOf(urlLoc).toEqualTypeOf<t.PkgDistLocationUrl>();
  });

  it('URL → PkgDistLocationUrl (root dist.json)', () => {
    const href = 'https://example.com/dist.json' as t.StringUrl;

    const loc = Dist.location(href);
    const urlLoc = expectUrl(loc);

    expect(urlLoc.kind).to.eql('url');
    expect(urlLoc.origin).to.eql('https://example.com');
    expect(urlLoc.pathname).to.eql('/dist.json');

    expect(urlLoc.root).to.eql('/');
    expect(urlLoc.segments).to.eql([]);
    expect(urlLoc.is.root).to.eql(true);
  });

  it('URL instance → PkgDistLocationUrl', () => {
    const url = new URL('https://example.com/pkg/foo/dist.json');

    const loc = Dist.location(url);
    const urlLoc = expectUrl(loc);

    expect(urlLoc.kind).to.eql('url');
    expect(urlLoc.href).to.eql('https://example.com/pkg/foo/dist.json');
    expect(urlLoc.root).to.eql('/pkg/foo');
    expect(urlLoc.segments).to.eql(['pkg', 'foo']);
    expect(urlLoc.is.root).to.eql(false);

    // Type-level: URL instance usage yields the URL variant.
    expectTypeOf(urlLoc).toEqualTypeOf<t.PkgDistLocationUrl>();
  });

  it('dir/path → PkgDistLocationDir (absolute)', () => {
    const dir = '/Users/phil/.tmp/dev/monaco' as t.StringDir;

    const loc = Dist.location(dir);
    const dirLoc = expectDir(loc);

    expect(dirLoc.kind).to.eql('dir');
    expect(dirLoc.dir).to.eql('/Users/phil/.tmp/dev/monaco');

    expect(dirLoc.root).to.eql('/Users/phil/.tmp/dev/monaco');
    expect(dirLoc.segments).to.eql(['Users', 'phil', '.tmp', 'dev', 'monaco']);
    expect(dirLoc.is.root).to.eql(false);

    // Type-level: dir/path usage yields the Dir variant.
    expectTypeOf(dirLoc).toEqualTypeOf<t.PkgDistLocationDir>();
  });

  it('dir/path → PkgDistLocationDir (relative + empty)', () => {
    // Relative path gets normalized to absolute.
    const rel = 'foo/bar' as t.StringPath;
    const locRel = Dist.location(rel);
    const dirRel = expectDir(locRel);

    expect(dirRel.kind).to.eql('dir');
    expect(dirRel.dir).to.eql('/foo/bar');
    expect(dirRel.root).to.eql('/foo/bar');
    expect(dirRel.segments).to.eql(['foo', 'bar']);
    expect(dirRel.is.root).to.eql(false);

    // Empty string collapses to "/" root.
    const locRoot = Dist.location('' as t.StringPath);
    const dirRoot = expectDir(locRoot);

    expect(dirRoot.kind).to.eql('dir');
    expect(dirRoot.dir).to.eql('/');
    expect(dirRoot.root).to.eql('/');
    expect(dirRoot.segments).to.eql([]);
    expect(dirRoot.is.root).to.eql(true);

    expectTypeOf(dirRoot).toEqualTypeOf<t.PkgDistLocationDir>();
  });
});
