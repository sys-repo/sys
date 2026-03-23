import { type t, c, describe, Esm, expect, Fs, Is, it, stripAnsi, Testing, Yaml } from '../../-test.ts';
import { Fmt } from './m.Fmt.ts';
import { DenoDeps } from './mod.ts';
import { DenoFile } from '../m.DenoFile/mod.ts';
import { Deps } from '@sys/esm/deps';

describe('DenoDeps', () => {
  const SAMPLE = {
    path: './src/-test/sample-2/deps.yaml',
  };

  it('API', () => {
    expect(DenoDeps.Fmt).to.equal(Fmt);
    expect(Is.func(DenoDeps.apply)).to.eql(true);
  });

  describe('DenoDeps compatibility', () => {
    it('adapts the pure manifest methods from @sys/esm/deps', async () => {
      const input = `
        deno.json:
          - import: npm:esbuild@0.27.3
      `;

      const esm = await Deps.from(input);
      const deno = await DenoDeps.from(input);

      expect(deno.error).to.eql(esm.error);
      expect(deno.data?.deps.map((dep) => dep.module.toString())).to.eql(
        esm.data?.entries.map((entry) => entry.module.toString()),
      );
      expect(deno.data?.deps.map((dep) => dep.target)).to.eql(
        esm.data?.entries.map((entry) => entry.target),
      );
      expect(deno.data?.modules.items.map((item) => item.toString())).to.eql(
        esm.data?.modules.items.map((item) => item.toString()),
      );
      const a = DenoDeps.toDep('jsr:@sys/tmp@0.1.2');
      const b = Deps.toEntry('jsr:@sys/tmp@0.1.2');
      expect(a.module.toString()).to.eql(b.module.toString());
      expect(a.target).to.eql(b.target);
      expect(a.dev).to.eql(b.dev);
      expect(a.subpaths).to.eql(b.subpaths);
      expect(DenoDeps.toYaml(deno.data?.deps ?? []).text).to.eql(Deps.toYaml(esm.data?.entries ?? []).text);
      expect(DenoDeps.findImport(deno.data?.deps, 'npm:esbuild')).to.eql(
        Deps.findImport(esm.data?.entries, 'npm:esbuild'),
      );
    });
  });

  describe('DenoDeps.Fmt', () => {
    it('renders the first dependency after a registry boundary', () => {
      const text = stripAnsi(DenoDeps.Fmt.deps([
        DenoDeps.toDep('jsr:@sys/std@0.0.1'),
        DenoDeps.toDep('npm:react@19.0.0'),
        DenoDeps.toDep('npm:react-dom@19.0.0'),
      ]));

      expect(text).to.match(/JSR\s+0\.0\.1\s+@sys\/std/);
      expect(text).to.match(/NPM\s+19\.0\.0\s+react/);
      expect(text).to.include('@sys/std');
      expect(text).to.include('react');
      expect(text).to.include('react-dom');
    });
  });

  describe('DenoDeps:toJson("deno.json")', () => {
    it('empty', () => {
      const a = DenoDeps.toJson('deno.json', []);
      const b = DenoDeps.toJson('deno.json');
      expect(a).to.eql({});
      expect(b).to.eql({});
    });

    it('imports', async () => {
      const res = await DenoDeps.from(SAMPLE.path);
      const json = DenoDeps.toJson('deno.json', res.data?.deps);
      expect(json).to.eql({
        imports: {
          '@automerge/automerge': 'npm:@automerge/automerge@2',
          '@automerge/automerge-repo': 'npm:@automerge/automerge-repo@1',
          '@noble/hashes': 'npm:@noble/hashes@1.7.1',
          '@std/assert': 'jsr:@std/assert@1.0.11',
          '@std/fs': 'jsr:@std/fs@1.0.11',
          '@std/http': 'jsr:@std/http@1.0.13',
          chai: 'npm:chai@5',
          'chai/': 'npm:chai@5/',
          'chai/chai.js': 'npm:chai@5/chai.js',
        },
      });
    });
  });

  describe('DenoDeps.toJson("package.json")', () => {
    it('empty', () => {
      const a = DenoDeps.toJson('package.json', []);
      const b = DenoDeps.toJson('package.json');
      expect(a).to.eql({});
      expect(b).to.eql({});
    });

    it('imports', async () => {
      const res = await DenoDeps.from(SAMPLE.path);
      const json = DenoDeps.toJson('package.json', res.data!.deps);

      expect(json).to.eql({
        dependencies: {
          '@std/assert': 'npm:@jsr/std__assert@1.0.11',
          rxjs: '7',
          hono: '4.6',
        },
        devDependencies: {
          '@std/http': 'npm:@jsr/std__http@1.0.13',
          '@types/react': '^18',
        },
      });
    });
  });

  describe('DenoDeps.apply', () => {
    type ImportMapJson = { imports?: Record<string, string>; scopes?: Record<string, unknown> };

    it('writes inline imports when no importMap is declared', async () => {
      const fs = await Testing.dir('DenoDeps.apply.inline');
      const denoPath = fs.join('deno.json');
      const dep = DenoDeps.toDep('jsr:@std/path@1.0.8', { target: 'deno.json' });

      await Fs.writeJson(denoPath, { name: 'inline-app', tasks: { dev: 'deno task dev' } });

      const res = await DenoDeps.apply(denoPath, [dep]);
      const file = await DenoFile.load(denoPath);

      expect(res.kind).to.eql('imports');
      expect(res.targetPath).to.eql(denoPath);
      expect(file.data?.tasks).to.eql({ dev: 'deno task dev' });
      expect(file.data?.imports).to.eql({
        '@std/path': 'jsr:@std/path@1.0.8',
      });
    });

    it('writes to the referenced importMap file when configured', async () => {
      const fs = await Testing.dir('DenoDeps.apply.importMap');
      const denoPath = fs.join('deno.json');
      const importMapPath = fs.join('config/imports.json');
      const dep = DenoDeps.toDep('jsr:@std/path@1.0.8', { target: 'deno.json' });

      await Fs.writeJson(denoPath, {
        name: 'import-map-app',
        importMap: './config/imports.json',
        tasks: { dev: 'deno task dev' },
      });
      await Fs.writeJson(importMapPath, { scopes: { '/foo': { bar: 'baz' } } });

      const res = await DenoDeps.apply(denoPath, [dep]);
      const file = await DenoFile.load(denoPath);
      const importMap = await Fs.readJson<ImportMapJson>(importMapPath);

      expect(res.kind).to.eql('importMap');
      expect(res.targetPath).to.eql(importMapPath);
      expect(file.data?.importMap).to.eql('./config/imports.json');
      expect(file.data?.tasks).to.eql({ dev: 'deno task dev' });
      expect(file.data?.imports).to.eql(undefined);
      expect(importMap.data).to.eql({
        imports: {
          '@std/path': 'jsr:@std/path@1.0.8',
        },
        scopes: {
          '/foo': { bar: 'baz' },
        },
      });
    });

    it('prefers importMap over inline imports when both are present', async () => {
      const fs = await Testing.dir('DenoDeps.apply.preferImportMap');
      const denoPath = fs.join('deno.json');
      const importMapPath = fs.join('imports.json');
      const dep = DenoDeps.toDep('jsr:@std/path@1.0.8', { target: 'deno.json' });

      await Fs.writeJson(denoPath, {
        name: 'dual-app',
        importMap: './imports.json',
        imports: { stale: 'jsr:@std/fmt@1.0.0' },
      });

      const res = await DenoDeps.apply(denoPath, [dep]);
      const file = await DenoFile.load(denoPath);
      const importMap = await Fs.readJson<{ imports?: Record<string, string> }>(importMapPath);

      expect(res.kind).to.eql('importMap');
      expect(file.data?.imports).to.eql(undefined);
      expect(importMap.data).to.eql({
        imports: {
          '@std/path': 'jsr:@std/path@1.0.8',
        },
      });
    });

    it('clears inline imports when no deno imports remain', async () => {
      const fs = await Testing.dir('DenoDeps.apply.clearInline');
      const denoPath = fs.join('deno.json');

      await Fs.writeJson(denoPath, {
        name: 'inline-clear-app',
        tasks: { dev: 'deno task dev' },
        imports: { stale: 'jsr:@std/fmt@1.0.0' },
      });

      const res = await DenoDeps.apply(denoPath, []);
      const file = await DenoFile.load(denoPath);

      expect(res.kind).to.eql('imports');
      expect(res.imports).to.eql({});
      expect(file.data?.tasks).to.eql({ dev: 'deno task dev' });
      expect(file.data?.imports).to.eql(undefined);
    });

    it('clears importMap imports when no deno imports remain and preserves other keys', async () => {
      const fs = await Testing.dir('DenoDeps.apply.clearImportMap');
      const denoPath = fs.join('deno.json');
      const importMapPath = fs.join('imports.json');

      await Fs.writeJson(denoPath, {
        name: 'import-map-clear-app',
        importMap: './imports.json',
      });
      await Fs.writeJson(importMapPath, {
        imports: { stale: 'jsr:@std/fmt@1.0.0' },
        scopes: { '/foo': { bar: 'baz' } },
      });

      const res = await DenoDeps.apply(denoPath, []);
      const file = await DenoFile.load(denoPath);
      const importMap = await Fs.readJson<ImportMapJson>(importMapPath);

      expect(res.kind).to.eql('importMap');
      expect(res.imports).to.eql({});
      expect(file.data?.imports).to.eql(undefined);
      expect(importMap.data).to.eql({
        scopes: {
          '/foo': { bar: 'baz' },
        },
      });
    });
  });
});
