import { describe, expect, expectTypeOf, it, type t } from '../../-test.ts';
import { ViteConfig } from '../../mod.ts';
import { ViteStartup } from '../../m.vite.startup/mod.ts';
import { Vite } from '../mod.ts';

describe('Vite', () => {
  it('API', () => {
    expect(Vite.Config).to.equal(ViteConfig);
    expect(Vite.Startup).to.equal(ViteStartup);
  });

  it('requires package metadata whenever a package subpath is present', () => {
    type Orphan = { pkgSubpath: 'ui' } extends t.Vite.Dev.Args ? true : false;
    type PackageBacked = {
      pkg: { name: '@sys/example'; version: '1.2.3' };
      pkgSubpath: 'ui';
    } extends t.Vite.Dev.Args ? true : false;

    expectTypeOf(false as Orphan).toEqualTypeOf<false>();
    expectTypeOf(true as PackageBacked).toEqualTypeOf<true>();
  });
});
