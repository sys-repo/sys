import { describe, expect, Fs, it, Testing } from '../../../-test.ts';
import { DenoFile } from '../../m.DenoFile/mod.ts';
import { DenoDeps } from '../mod.ts';

describe('DenoDeps.applyDeno', () => {
  type ImportMapJson = { imports?: Record<string, string>; scopes?: Record<string, unknown> };

  it('writes inline imports when no importMap is declared', async () => {
    const fs = await Testing.dir('DenoDeps.applyDeno.inline');
    const denoPath = fs.join('deno.json');
    const dep = DenoDeps.toDep('jsr:@std/path@1.0.8', { target: 'deno.json' });

    await Fs.writeJson(denoPath, { name: 'inline-app', tasks: { dev: 'deno task dev' } });

    const res = await DenoDeps.applyDeno(denoPath, [dep]);
    const file = await DenoFile.load(denoPath);

    expect(res.kind).to.eql('imports');
    expect(res.targetPath).to.eql(denoPath);
    expect(file.data?.tasks).to.eql({ dev: 'deno task dev' });
    expect(file.data?.imports).to.eql({
      '@std/path': 'jsr:@std/path@1.0.8',
    });
  });

  it('writes to the referenced importMap file when configured', async () => {
    const fs = await Testing.dir('DenoDeps.applyDeno.importMap');
    const denoPath = fs.join('deno.json');
    const importMapPath = fs.join('config/imports.json');
    const dep = DenoDeps.toDep('jsr:@std/path@1.0.8', { target: 'deno.json' });

    await Fs.writeJson(denoPath, {
      name: 'import-map-app',
      importMap: './config/imports.json',
      tasks: { dev: 'deno task dev' },
    });
    await Fs.writeJson(importMapPath, { scopes: { '/foo': { bar: 'baz' } } });

    const res = await DenoDeps.applyDeno(denoPath, [dep]);
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
    const fs = await Testing.dir('DenoDeps.applyDeno.preferImportMap');
    const denoPath = fs.join('deno.json');
    const importMapPath = fs.join('imports.json');
    const dep = DenoDeps.toDep('jsr:@std/path@1.0.8', { target: 'deno.json' });

    await Fs.writeJson(denoPath, {
      name: 'dual-app',
      importMap: './imports.json',
      imports: { stale: 'jsr:@std/fmt@1.0.0' },
    });

    const res = await DenoDeps.applyDeno(denoPath, [dep]);
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
    const fs = await Testing.dir('DenoDeps.applyDeno.clearInline');
    const denoPath = fs.join('deno.json');

    await Fs.writeJson(denoPath, {
      name: 'inline-clear-app',
      tasks: { dev: 'deno task dev' },
      imports: { stale: 'jsr:@std/fmt@1.0.0' },
    });

    const res = await DenoDeps.applyDeno(denoPath, []);
    const file = await DenoFile.load(denoPath);

    expect(res.kind).to.eql('imports');
    expect(res.imports).to.eql({});
    expect(file.data?.tasks).to.eql({ dev: 'deno task dev' });
    expect(file.data?.imports).to.eql(undefined);
  });

  it('clears importMap imports when no deno imports remain and preserves other keys', async () => {
    const fs = await Testing.dir('DenoDeps.applyDeno.clearImportMap');
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

    const res = await DenoDeps.applyDeno(denoPath, []);
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
