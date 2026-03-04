import { syncByKey, syncTemplateImports, syncTemplatePackage } from '../-prep.u.ts';
import { describe, expect, it } from '../../src/-test.ts';

describe('prep.u', () => {
  it('syncByKey → updates each target key deterministically', () => {
    const input = { a: '1', b: '2' };
    const res = syncByKey(input, (key) => `${key}.next`);

    expect(res).to.eql({ a: 'a.next', b: 'b.next' });
    expect(input).to.eql({ a: '1', b: '2' });
  });

  it('syncTemplateImports → updates direct @sys imports from authorities', () => {
    const input = {
      imports: {
        '@sys/fs': 'jsr:@sys/fs@0.0.0',
        '@sys/std': 'jsr:@sys/std@0.0.0',
        '@sys/std/async': 'jsr:@sys/std@0.0.0/async',
        '@sys/testing/server': 'jsr:@sys/testing@0.0.0/server',
        '@sys/tools': 'jsr:@sys/tools@0.0.252',
        '@sys/tmpl': 'jsr:@sys/tmpl@0.0.252',
      },
    };
    const authority = {
      imports: {
        '@sys/fs': 'jsr:@sys/fs@0.0.243',
        '@sys/std': 'jsr:@sys/std@0.0.300',
        '@sys/std/async': 'jsr:@sys/std@0.0.300/async',
        '@sys/testing/server': 'jsr:@sys/testing@0.0.234/server',
      },
    };
    const versions = {
      '@sys/fs': '0.0.243',
      '@sys/std': '0.0.300',
      '@sys/testing': '0.0.234',
      '@sys/tools': '0.2.4',
      '@sys/tmpl': '0.3.7',
    };

    const res = syncTemplateImports(input, authority, versions);
    expect(res.imports['@sys/fs']).to.eql('jsr:@sys/fs@0.0.243');
    expect(res.imports['@sys/std']).to.eql('jsr:@sys/std@0.0.300');
    expect(res.imports['@sys/std/async']).to.eql('jsr:@sys/std@0.0.300/async');
    expect(res.imports['@sys/testing/server']).to.eql('jsr:@sys/testing@0.0.234/server');
    expect(res.imports['@sys/tools']).to.eql('jsr:@sys/tools@0.2.4');
    expect(res.imports['@sys/tmpl']).to.eql('jsr:@sys/tmpl@0.3.7');
  });

  it('syncTemplateImports → throws when a required import key is missing in root deno.imports.json', () => {
    const input = { imports: { foo: 'jsr:@foo/bar@0.0.0' } };
    const authority = { imports: {} };

    expect(() => syncTemplateImports(input, authority, {})).to.throw(
      'Missing import "foo" in root deno.imports.json',
    );
  });

  it('syncTemplateImports → throws when a required @sys package version is missing', () => {
    const input = { imports: { '@sys/fs': 'jsr:@sys/fs@0.0.0' } };
    const authority = { imports: {} };

    expect(() => syncTemplateImports(input, authority, {})).to.throw(
      'Missing version authority for package "@sys/fs"',
    );
  });

  it('syncTemplatePackage → syncs dependency versions from root package', () => {
    const input = {
      dependencies: { react: '0.0.0' },
      devDependencies: { vite: '0.0.0' },
    };
    const source = {
      dependencies: { react: '19.2.4' },
      devDependencies: { vite: '7.3.1' },
    };

    const res = syncTemplatePackage(input, source);
    expect(res.dependencies?.react).to.eql('19.2.4');
    expect(res.devDependencies?.vite).to.eql('7.3.1');
  });

  it('syncTemplatePackage → throws when a required key is missing in root package', () => {
    const input = {
      dependencies: { react: '0.0.0' },
      devDependencies: { vite: '0.0.0' },
    };
    const source = { dependencies: { react: '19.2.4' }, devDependencies: {} };

    expect(() => syncTemplatePackage(input, source)).to.throw(
      'Missing dependency "vite" in root package.json',
    );
  });
});
