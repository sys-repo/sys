import {
  assertImportMap,
  readJson,
  resolvePackageVersions,
  syncByKey,
  syncTemplateImports,
  syncTemplatePackage,
} from '../-prep.u.ts';
import { DenoFile, describe, expect, Fs, it, type t } from '../../src/-test.ts';

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

  it('syncTemplateImports → throws when a required import key is missing in root imports.json', () => {
    const input = { imports: { foo: 'jsr:@foo/bar@0.0.0' } };
    const authority = { imports: {} };

    expect(() => syncTemplateImports(input, authority, {})).to.throw(
      'Missing import "foo" in root imports.json',
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

  it('resolvePackageVersions → reads versions from workspace authority', async () => {
    const imports = {
      imports: {
        '@sys/fs': 'jsr:@sys/fs@0.0.0',
        '@sys/tmpl': 'jsr:@sys/tmpl@0.0.0',
      },
    };
    const calls: Array<{ name: string; src?: string }> = [];
    const denoFile = {
      workspaceVersion(name: string, src?: string) {
        calls.push({ name, src });
        if (name === '@sys/fs') return Promise.resolve('0.0.243');
        if (name === '@sys/tmpl') return Promise.resolve('0.0.259');
        return Promise.resolve(undefined);
      },
    };

    const res = await resolvePackageVersions('/tmp/deno.json', imports, denoFile);

    expect(res).to.eql({
      '@sys/fs': '0.0.243',
      '@sys/tmpl': '0.0.259',
    });
    expect(calls).to.eql([
      { name: '@sys/fs', src: '/tmp/deno.json' },
      { name: '@sys/tmpl', src: '/tmp/deno.json' },
    ]);
  });

  it('resolvePackageVersions → throws when workspace authority is missing', async () => {
    const imports = { imports: { '@sys/fs': 'jsr:@sys/fs@0.0.0' } };
    const denoFile = {
      workspaceVersion() {
        return Promise.resolve(undefined);
      },
    };

    try {
      await resolvePackageVersions('/tmp/deno.json', imports, denoFile);
      throw new Error('Expected resolvePackageVersions to throw');
    } catch (error) {
      expect((error as Error).message).to.eql(
        'Missing workspace version authority for package "@sys/fs": /tmp/deno.json',
      );
    }
  });

  it('parity invariant → prep sync result equals template files for all current keys', async () => {
    const root = Fs.resolve(import.meta.dirname ?? '.', '..', '..', '..', '..');
    const path = {
      tmplRepoImports: Fs.join(root, 'code/-tmpl/-templates/tmpl.repo/imports.json'),
      tmplRepoPackage: Fs.join(root, 'code/-tmpl/-templates/tmpl.repo/package.json'),
      rootPackage: Fs.join(root, 'package.json'),
      rootImports: Fs.join(root, 'imports.json'),
      rootDenoJson: Fs.join(root, 'deno.json'),
    } as const;

    const [repoImportsRaw, repoPackage, rootPackage, rootImportsRaw] = await Promise.all([
      readJson<t.Json>(path.tmplRepoImports),
      readJson<t.PkgJsonNode>(path.tmplRepoPackage),
      readJson<t.PkgJsonNode>(path.rootPackage),
      readJson<t.Json>(path.rootImports),
    ]);
    const repoImports = assertImportMap(repoImportsRaw, path.tmplRepoImports);
    const rootImports = assertImportMap(rootImportsRaw, path.rootImports);
    const versions = await resolvePackageVersions(path.rootDenoJson, repoImports, DenoFile);

    const syncedImports = syncTemplateImports(repoImports, rootImports, versions);
    const syncedPackage = syncTemplatePackage(repoPackage, rootPackage);

    expect(syncedImports.imports).to.eql(repoImports.imports);
    expect(syncedPackage).to.eql(repoPackage);
  });
});
