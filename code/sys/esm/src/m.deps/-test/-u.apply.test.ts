import { describe, expect, Fs, it, Testing } from './common.ts';
import { Deps } from '../mod.ts';

describe('Deps.applyDeno', () => {
  type ImportMapJson = { imports?: Record<string, string>; scopes?: Record<string, unknown> };
  type DenoConfigJson = {
    imports?: Record<string, string>;
    importMap?: string;
    tasks?: Record<string, string>;
  };

  it('writes inline imports when no importMap is declared', async () => {
    const fs = await Testing.dir('EsmDeps.applyDeno.inline');
    const denoPath = fs.join('deno.json');
    const entry = Deps.toEntry('jsr:@std/path@1.0.8', { target: 'deno.json' });

    await Fs.writeJson(denoPath, { name: 'inline-app', tasks: { dev: 'deno task dev' } });

    const res = await Deps.applyDeno(denoPath, [entry]);
    const file = await Fs.readJson<DenoConfigJson>(denoPath);

    expect(res.kind).to.eql('imports');
    expect(res.targetPath).to.eql(denoPath);
    expect(file.data?.tasks).to.eql({ dev: 'deno task dev' });
    expect(file.data?.imports).to.eql({
      '@std/path': 'jsr:@std/path@1.0.8',
    });
  });

  it('writes to the referenced importMap file when configured', async () => {
    const fs = await Testing.dir('EsmDeps.applyDeno.importMap');
    const denoPath = fs.join('deno.json');
    const importMapPath = fs.join('config/imports.json');
    const entry = Deps.toEntry('jsr:@std/path@1.0.8', { target: 'deno.json' });

    await Fs.writeJson(denoPath, {
      name: 'import-map-app',
      importMap: './config/imports.json',
      tasks: { dev: 'deno task dev' },
    });
    await Fs.writeJson(importMapPath, { scopes: { '/foo': { bar: 'baz' } } });

    const res = await Deps.applyDeno(denoPath, [entry]);
    const file = await Fs.readJson<DenoConfigJson>(denoPath);
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
    const fs = await Testing.dir('EsmDeps.applyDeno.preferImportMap');
    const denoPath = fs.join('deno.json');
    const importMapPath = fs.join('imports.json');
    const entry = Deps.toEntry('jsr:@std/path@1.0.8', { target: 'deno.json' });

    await Fs.writeJson(denoPath, {
      name: 'dual-app',
      importMap: './imports.json',
      imports: { stale: 'jsr:@std/fmt@1.0.0' },
    });

    const res = await Deps.applyDeno(denoPath, [entry]);
    const file = await Fs.readJson<DenoConfigJson>(denoPath);
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
    const fs = await Testing.dir('EsmDeps.applyDeno.clearInline');
    const denoPath = fs.join('deno.json');

    await Fs.writeJson(denoPath, {
      name: 'inline-clear-app',
      tasks: { dev: 'deno task dev' },
      imports: { stale: 'jsr:@std/fmt@1.0.0' },
    });

    const res = await Deps.applyDeno(denoPath, []);
    const file = await Fs.readJson<DenoConfigJson>(denoPath);

    expect(res.kind).to.eql('imports');
    expect(res.imports).to.eql({});
    expect(file.data?.tasks).to.eql({ dev: 'deno task dev' });
    expect(file.data?.imports).to.eql(undefined);
  });

  it('clears importMap imports when no deno imports remain and preserves other keys', async () => {
    const fs = await Testing.dir('EsmDeps.applyDeno.clearImportMap');
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

    const res = await Deps.applyDeno(denoPath, []);
    const file = await Fs.readJson<DenoConfigJson>(denoPath);
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

  it('accepts a directory path and resolves deno.json within it', async () => {
    const fs = await Testing.dir('EsmDeps.applyDeno.directory');
    const denoPath = fs.join('deno.json');
    const entry = Deps.toEntry('jsr:@std/path@1.0.8', { target: 'deno.json' });

    await Fs.writeJson(denoPath, { name: 'dir-app', tasks: { dev: 'deno task dev' } });

    const res = await Deps.applyDeno(fs.dir, [entry]);
    const file = await Fs.readJson<DenoConfigJson>(denoPath);

    expect(res.denoFilePath).to.eql(denoPath);
    expect(file.data?.imports).to.eql({
      '@std/path': 'jsr:@std/path@1.0.8',
    });
  });

  it('supports deno.jsonc targets', async () => {
    const fs = await Testing.dir('EsmDeps.applyDeno.jsonc');
    const denoPath = fs.join('deno.jsonc');
    const entry = Deps.toEntry('jsr:@std/path@1.0.8', { target: 'deno.json' });

    await Fs.write(
      denoPath,
      `{
        // jsonc stays supported
        "name": "jsonc-app",
        "tasks": { "dev": "deno task dev" }
      }`,
    );

    const res = await Deps.applyDeno(denoPath, [entry]);
    const file = await Fs.readText(denoPath);

    expect(res.denoFilePath).to.eql(denoPath);
    expect(file.data).to.include(`"@std/path": "jsr:@std/path@1.0.8"`);
    expect(file.data).to.include(`"tasks": {`);
  });
});
