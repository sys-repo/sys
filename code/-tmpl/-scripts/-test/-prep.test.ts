import {
  assertImportMap,
  PATH,
  assertPublishedImportExports,
  augmentImportMapFromSpecifiers,
  augmentTemplateDeps,
  collectTemplateBareImports,
  extractBareImports,
  readJson,
  readPublishedPackageExports,
  resolvePublishedPackageVersions,
  resolvePackageVersions,
  syncByKey,
  syncTemplateDeps,
  syncTemplateImports,
  syncTemplatePackage,
} from '../-prep.u.ts';
import { DenoDeps } from '@sys/driver-deno/runtime';
import { DenoFile, describe, expect, Fs, it, type t } from '../../src/-test.ts';
import { resolveVersions } from '../task.prep.ts';

describe('prep.u', () => {
  it('syncByKey → updates each target key deterministically', () => {
    const input = { a: '1', b: '2' };
    const res = syncByKey(input, (key) => `${key}.next`);

    expect(res).to.eql({ a: 'a.next', b: 'b.next' });
    expect(input).to.eql({ a: '1', b: '2' });
  });

  it('extractBareImports → captures bare package specifiers used by template source', () => {
    const text = `
      import { Try } from '@sys/std/try';
      export { Obj } from "@sys/std/obj";
      import '@sys/std/log';
      const mod = await import('@sys/std/dispose');
      import { local } from './local.ts';
    `;

    expect(extractBareImports(text)).to.eql([
      '@sys/std/dispose',
      '@sys/std/log',
      '@sys/std/obj',
      '@sys/std/try',
    ]);
  });

  it('augmentImportMapFromSpecifiers → adds missing authority keys required by template source', () => {
    const input = { imports: { '@sys/std': 'jsr:@sys/std@0.0.0' } };
    const authority = {
      imports: {
        '@sys/std/path': 'jsr:@sys/std@0.0.0/path',
      },
    };

    const res = augmentImportMapFromSpecifiers(input, authority, [
      '@sys/std/try',
      '@sys/std/path',
      './local.ts',
    ]);

    expect(Object.keys(res.imports).sort()).to.eql([
      '@sys/std',
      '@sys/std/path',
      '@sys/std/try',
    ]);
  });

  it('augmentTemplateDeps → adds missing subpaths required by template source', () => {
    const deps = [DenoDeps.toDep('jsr:@sys/std@0.0.337', { subpaths: ['arr', 'str'] })];
    const versions = { '@sys/std': '0.0.337' };

    const res = augmentTemplateDeps(deps, ['@sys/std/try', '@sys/std/obj', '@sys/std/str'], versions);
    const dep = res[0];

    expect(dep.module.toString()).to.eql('jsr:@sys/std@0.0.337');
    expect(dep.subpaths).to.eql(['arr', 'obj', 'str', 'try']);
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

  it('syncTemplateImports → preserves required driver-vite and ui subpath imports for generated repos', () => {
    const input = {
      imports: {
        '@sys/driver-vite': 'jsr:@sys/driver-vite@0.0.0',
        '@sys/driver-vite/main': 'jsr:@sys/driver-vite@0.0.0/main',
        '@sys/driver-vite/t': 'jsr:@sys/driver-vite@0.0.0/t',
        '@sys/fs': 'jsr:@sys/fs@0.0.0',
        '@sys/fs/t': 'jsr:@sys/fs@0.0.0/t',
        '@sys/http/client': 'jsr:@sys/http@0.0.0/client',
        '@sys/http/t': 'jsr:@sys/http@0.0.0/t',
        '@sys/workspace': 'jsr:@sys/workspace@0.0.0',
        '@sys/workspace/cli': 'jsr:@sys/workspace@0.0.0/cli',
        '@sys/workspace/t': 'jsr:@sys/workspace@0.0.0/t',
        '@sys/workspace/testing': 'jsr:@sys/workspace@0.0.0/testing',
        '@sys/process': 'jsr:@sys/process@0.0.0',
        '@sys/process/t': 'jsr:@sys/process@0.0.0/t',
        '@sys/ui-css': 'jsr:@sys/ui-css@0.0.0',
        '@sys/ui-dom': 'jsr:@sys/ui-dom@0.0.0',
        '@sys/ui-react': 'jsr:@sys/ui-react@0.0.0',
        '@sys/ui-react-components': 'jsr:@sys/ui-react-components@0.0.0',
        '@sys/ui-react-devharness': 'jsr:@sys/ui-react-devharness@0.0.0',
        '@sys/std': 'jsr:@sys/std@0.0.0',
        '@sys/std/t': 'jsr:@sys/std@0.0.0/t',
        '@sys/tmpl': 'jsr:@sys/tmpl@0.0.0',
        '@sys/tmpl/t': 'jsr:@sys/tmpl@0.0.0/t',
        '@sys/tools': 'jsr:@sys/tools@0.0.0',
        '@sys/tools/t': 'jsr:@sys/tools@0.0.0/t',
        '@sys/ui-react/t': 'jsr:@sys/ui-react@0.0.0/t',
        '@sys/ui-react-components/t': 'jsr:@sys/ui-react-components@0.0.0/t',
      },
    };
    const authority = {
      imports: {
        '@sys/driver-vite': 'jsr:@sys/driver-vite@0.0.297',
        '@sys/driver-vite/main': 'jsr:@sys/driver-vite@0.0.297/main',
      },
    };
    const versions = {
      '@sys/driver-vite': '0.0.297',
      '@sys/fs': '0.0.243',
      '@sys/http': '0.0.210',
      '@sys/workspace': '0.0.011',
      '@sys/process': '0.0.201',
      '@sys/std': '0.0.300',
      '@sys/tmpl': '0.3.7',
      '@sys/tools': '0.2.4',
      '@sys/ui-css': '0.0.231',
      '@sys/ui-dom': '0.0.237',
      '@sys/ui-react': '0.0.245',
      '@sys/ui-react-components': '0.0.197',
      '@sys/ui-react-devharness': '0.0.242',
    };

    const res = syncTemplateImports(input, authority, versions);
    expect(res.imports['@sys/driver-vite']).to.eql('jsr:@sys/driver-vite@0.0.297');
    expect(res.imports['@sys/driver-vite/main']).to.eql('jsr:@sys/driver-vite@0.0.297/main');
    expect(res.imports['@sys/driver-vite/t']).to.eql('jsr:@sys/driver-vite@0.0.297/t');
    expect(res.imports['@sys/fs']).to.eql('jsr:@sys/fs@0.0.243');
    expect(res.imports['@sys/fs/t']).to.eql('jsr:@sys/fs@0.0.243/t');
    expect(res.imports['@sys/http/client']).to.eql('jsr:@sys/http@0.0.210/client');
    expect(res.imports['@sys/http/t']).to.eql('jsr:@sys/http@0.0.210/t');
    expect(res.imports['@sys/workspace']).to.eql('jsr:@sys/workspace@0.0.011');
    expect(res.imports['@sys/workspace/cli']).to.eql('jsr:@sys/workspace@0.0.011/cli');
    expect(res.imports['@sys/workspace/t']).to.eql('jsr:@sys/workspace@0.0.011/t');
    expect(res.imports['@sys/workspace/testing']).to.eql(
      'jsr:@sys/workspace@0.0.011/testing',
    );
    expect(res.imports['@sys/process']).to.eql('jsr:@sys/process@0.0.201');
    expect(res.imports['@sys/process/t']).to.eql('jsr:@sys/process@0.0.201/t');
    expect(res.imports['@sys/std']).to.eql('jsr:@sys/std@0.0.300');
    expect(res.imports['@sys/std/t']).to.eql('jsr:@sys/std@0.0.300/t');
    expect(res.imports['@sys/tmpl']).to.eql('jsr:@sys/tmpl@0.3.7');
    expect(res.imports['@sys/tmpl/t']).to.eql('jsr:@sys/tmpl@0.3.7/t');
    expect(res.imports['@sys/tools']).to.eql('jsr:@sys/tools@0.2.4');
    expect(res.imports['@sys/tools/t']).to.eql('jsr:@sys/tools@0.2.4/t');
    expect(res.imports['@sys/ui-css']).to.eql('jsr:@sys/ui-css@0.0.231');
    expect(res.imports['@sys/ui-dom']).to.eql('jsr:@sys/ui-dom@0.0.237');
    expect(res.imports['@sys/ui-react']).to.eql('jsr:@sys/ui-react@0.0.245');
    expect(res.imports['@sys/ui-react/t']).to.eql('jsr:@sys/ui-react@0.0.245/t');
    expect(res.imports['@sys/ui-react-components']).to.eql('jsr:@sys/ui-react-components@0.0.197');
    expect(res.imports['@sys/ui-react-components/t']).to.eql('jsr:@sys/ui-react-components@0.0.197/t');
    expect(res.imports['@sys/ui-react-devharness']).to.eql('jsr:@sys/ui-react-devharness@0.0.242');
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

  it('resolvePublishedPackageVersions → reads latest published versions from authority', async () => {
    const imports = {
      imports: {
        '@sys/fs': 'jsr:@sys/fs@0.0.0',
        '@sys/tmpl': 'jsr:@sys/tmpl@0.0.0',
      },
    };
    const calls: string[] = [];
    const published = {
      latestVersion(name: string) {
        calls.push(name);
        const resolve = (res: { kind: 'published'; version: string } | { kind: 'unpublished' }) => Promise.resolve(res);
        if (name === '@sys/fs') return resolve({ kind: 'published', version: '0.0.243' });
        if (name === '@sys/tmpl') return resolve({ kind: 'published', version: '0.0.259' });
        return resolve({ kind: 'unpublished' });
      },
    };
    const denoFile = {
      workspaceVersion() {
        return Promise.resolve(undefined);
      },
    };

    const res = await resolvePublishedPackageVersions(
      imports,
      published,
      '/tmp/deno.json',
      denoFile,
    );

    expect(res).to.eql({
      '@sys/fs': '0.0.243',
      '@sys/tmpl': '0.0.259',
    });
    expect(calls).to.eql(['@sys/fs', '@sys/tmpl']);
  });

  it('resolvePublishedPackageVersions → falls back to workspace authority when package is unpublished', async () => {
    const imports = { imports: { '@sys/fs': 'jsr:@sys/fs@0.0.0' } };
    const calls: string[] = [];
    const published = {
      latestVersion(name: string) {
        calls.push(name);
        return Promise.resolve({ kind: 'unpublished' } as const);
      },
    };
    const denoFile = {
      workspaceVersion(name: string, src?: string) {
        expect(name).to.eql('@sys/fs');
        expect(src).to.eql('/tmp/deno.json');
        return Promise.resolve('0.0.243');
      },
    };

    const res = await resolvePublishedPackageVersions(
      imports,
      published,
      '/tmp/deno.json',
      denoFile,
    );

    expect(res).to.eql({ '@sys/fs': '0.0.243' });
    expect(calls).to.eql(['@sys/fs']);
  });

  it('resolvePublishedPackageVersions → throws when unpublished package has no workspace authority', async () => {
    const imports = { imports: { '@sys/fs': 'jsr:@sys/fs@0.0.0' } };
    const published = {
      latestVersion() {
        return Promise.resolve({ kind: 'unpublished' } as const);
      },
    };
    const denoFile = {
      workspaceVersion() {
        return Promise.resolve(undefined);
      },
    };

    try {
      await resolvePublishedPackageVersions(imports, published, '/tmp/deno.json', denoFile);
      throw new Error('Expected resolvePublishedPackageVersions to throw');
    } catch (error) {
      expect((error as Error).message).to.eql(
        'Missing workspace version authority for package "@sys/fs": /tmp/deno.json',
      );
    }
  });

  it('resolvePublishedPackageVersions → throws when published authority fails for non-404 reasons', async () => {
    const imports = { imports: { '@sys/fs': 'jsr:@sys/fs@0.0.0' } };
    const published = {
      latestVersion() {
        throw new Error('registry unavailable');
      },
    };
    const denoFile = {
      workspaceVersion() {
        return Promise.resolve('0.0.243');
      },
    };

    try {
      await resolvePublishedPackageVersions(imports, published, '/tmp/deno.json', denoFile);
      throw new Error('Expected resolvePublishedPackageVersions to throw');
    } catch (error) {
      expect((error as Error).message).to.eql('registry unavailable');
    }
  });

  it('readPublishedPackageExports → retries transient fetch failure before succeeding', async () => {
    const calls: Array<{ pkg: string; version?: string }> = [];
    const waits: number[] = [];

    const res = await readPublishedPackageExports('@sys/ui-css', '0.0.272', {
      async info(pkg: string, version?: string) {
        calls.push({ pkg, version });
        if (calls.length < 3) throw new Error('registry unavailable');
        return {
          ok: true,
          status: 200,
          data: {
            exports: { '.': './src/mod.ts', './t': './src/types.ts' },
          },
        } as const;
      },
      async wait(msec: number) {
        waits.push(msec);
      },
    });

    expect(res).to.eql({
      kind: 'published',
      exports: { '.': './src/mod.ts', './t': './src/types.ts' },
    });
    expect(calls).to.eql([
      { pkg: '@sys/ui-css', version: '0.0.272' },
      { pkg: '@sys/ui-css', version: '0.0.272' },
      { pkg: '@sys/ui-css', version: '0.0.272' },
    ]);
    expect(waits).to.eql([500, 1000]);
  });

  it('readPublishedPackageExports → returns unpublished on 404 without retrying further', async () => {
    const waits: number[] = [];
    const res = await readPublishedPackageExports('@sys/ui-css', '0.0.272', {
      async info() {
        return { ok: false, status: 404, data: undefined } as const;
      },
      async wait(msec: number) {
        waits.push(msec);
      },
    });

    expect(res).to.eql({ kind: 'unpublished' });
    expect(waits).to.eql([]);
  });

  it('readPublishedPackageExports → throws after bounded transient failures', async () => {
    const waits: number[] = [];

    try {
      await readPublishedPackageExports('@sys/ui-css', '0.0.272', {
        async info() {
          throw new Error('registry unavailable');
        },
        async wait(msec: number) {
          waits.push(msec);
        },
      });
      throw new Error('Expected readPublishedPackageExports to throw');
    } catch (error) {
      expect((error as Error).message).to.eql('Failed to fetch JSR package exports: @sys/ui-css@0.0.272');
      expect(waits).to.eql([500, 1000]);
    }
  });

  it('assertPublishedImportExports → accepts published template leaves when the published version exports them directly', async () => {
    const imports = {
      imports: {
        '@sys/std': 'jsr:@sys/std@0.0.0',
        '@sys/std/num': 'jsr:@sys/std@0.0.0/num',
        '@sys/std/obj': 'jsr:@sys/std@0.0.0/obj',
        '@sys/std/try': 'jsr:@sys/std@0.0.0/try',
      },
    };
    const versions = { '@sys/std': '0.0.338' };
    const published = {
      exports() {
        return Promise.resolve({
          kind: 'published' as const,
          exports: {
            '.': './src/mod.ts',
            './num': './src/m.Num/mod.ts',
            './obj': './src/m.Obj/mod.ts',
            './try': './src/m.Try/mod.ts',
          },
        });
      },
    };

    await assertPublishedImportExports(imports, versions, published);
  });

  it('assertPublishedImportExports → throws when template imports a leaf missing from the published version and no sanctioned bridge exists', async () => {
    const imports = {
      imports: {
        '@sys/std': 'jsr:@sys/std@0.0.0',
        '@sys/std/num': 'jsr:@sys/std@0.0.0/num',
      },
    };
    const versions = { '@sys/std': '0.0.336' };
    const published = {
      exports() {
        return Promise.resolve({
          kind: 'published' as const,
          exports: { '.': './src/mod.ts', './time': './src/-exports/-time.ts' },
        });
      },
    };

    try {
      await assertPublishedImportExports(imports, versions, published);
      throw new Error('Expected assertPublishedImportExports to throw');
    } catch (error) {
      expect((error as Error).message).to.include('@sys/std@0.0.336');
      expect((error as Error).message).to.include('missing ./num');
    }
  });

  it('assertPublishedImportExports → allows template imports when the published version exports every requested leaf', async () => {
    const imports = {
      imports: {
        '@sys/std': 'jsr:@sys/std@0.0.0',
        '@sys/std/time': 'jsr:@sys/std@0.0.0/time',
      },
    };
    const versions = { '@sys/std': '0.0.336' };
    const published = {
      exports() {
        return Promise.resolve({
          kind: 'published' as const,
          exports: { '.': './src/mod.ts', './time': './src/-exports/-time.ts' },
        });
      },
    };

    await assertPublishedImportExports(imports, versions, published);
  });

  it('assertPublishedImportExports → skips unpublished packages that still resolve via workspace fallback', async () => {
    const imports = {
      imports: {
        '@sys/foo': 'jsr:@sys/foo@0.0.0',
        '@sys/foo/bar': 'jsr:@sys/foo@0.0.0/bar',
      },
    };
    const versions = { '@sys/foo': '0.0.1' };
    const published = {
      exports() {
        return Promise.resolve({ kind: 'unpublished' as const });
      },
    };

    await assertPublishedImportExports(imports, versions, published);
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
      tmplRepoDeps: Fs.join(root, 'code/-tmpl/-templates/tmpl.repo/-deps.yaml'),
      tmplRepoImports: Fs.join(root, 'code/-tmpl/-templates/tmpl.repo/imports.json'),
      tmplRepoPackage: Fs.join(root, 'code/-tmpl/-templates/tmpl.repo/-package.json'),
      rootPackage: Fs.join(root, 'package.json'),
      rootImports: Fs.join(root, 'imports.json'),
      rootDenoJson: Fs.join(root, 'deno.json'),
    } as const;

    const [repoDepsText, repoImportsRaw, repoPackage, rootPackage, rootImportsRaw] = await Promise.all([
      Fs.readText(path.tmplRepoDeps).then((res) => {
        if (!res.ok || res.data === undefined) throw new Error(`Failed to read: ${path.tmplRepoDeps}`);
        return res.data;
      }),
      readJson<t.Json>(path.tmplRepoImports),
      readJson<t.PkgNodeJson>(path.tmplRepoPackage),
      readJson<t.PkgNodeJson>(path.rootPackage),
      readJson<t.Json>(path.rootImports),
    ]);
    const repoImports = assertImportMap(repoImportsRaw, path.tmplRepoImports);
    const rootImports = assertImportMap(rootImportsRaw, path.rootImports);
    const repoDeps = await DenoDeps.from(repoDepsText);
    if (repoDeps.error || !repoDeps.data) throw new Error(`Failed to read deps manifest: ${path.tmplRepoDeps}`);
    const currentVersions = Object.fromEntries(
      Object.keys(repoImports.imports)
        .map((specifier) => {
          const pkg = specifier.startsWith('@sys/')
            ? specifier.split('/').slice(0, 2).join('/')
            : undefined;
          if (!pkg) return undefined;
          const current = repoImports.imports[specifier];
          const match = current.match(/@(\d+\.\d+\.\d+)/);
          return match ? ([pkg, match[1]] as const) : undefined;
        })
        .filter((entry): entry is readonly [string, string] => !!entry),
    );

    const templateSpecifiers = await collectTemplateBareImports([
      Fs.join(root, 'code/-tmpl/-templates/tmpl.repo'),
      Fs.join(root, 'code/-tmpl/-templates/tmpl.pkg'),
    ]);
    const augmentedImports = augmentImportMapFromSpecifiers(repoImports, rootImports, templateSpecifiers);
    const syncedImports = syncTemplateImports(augmentedImports, rootImports, currentVersions);
    const syncedPackage = syncTemplatePackage(repoPackage, rootPackage);
    const augmentedDeps = augmentTemplateDeps(repoDeps.data.deps, templateSpecifiers, currentVersions);
    const syncedDeps = syncTemplateDeps(augmentedDeps, currentVersions, rootPackage);
    const syncedDepsText = DenoDeps.toYaml(syncedDeps).text;

    expect(syncedDepsText).to.eql(repoDepsText);
    expect(syncedImports.imports).to.eql(repoImports.imports);
    expect(syncedPackage).to.eql(repoPackage);
  });

  it('task.prep → default version source is workspace release state', async () => {
    const root = Fs.resolve(import.meta.dirname ?? '.', '..', '..', '..', '..');
    const path = PATH.fromRoot(root);
    const repoImportsRaw = await readJson<t.Json>(path.tmplRepoImports);
    const repoImports = assertImportMap(repoImportsRaw, path.tmplRepoImports);
    const expected = await resolvePackageVersions(path.rootDenoJson, repoImports, DenoFile);
    const actual = await resolveVersions('workspace', repoImports);
    expect(actual).to.eql(expected);
  });
});
