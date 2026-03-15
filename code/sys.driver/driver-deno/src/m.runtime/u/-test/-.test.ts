import { describe, expect, Fs, it, Testing } from '../../../-test.ts';
import { DenoDeps } from '../../m.DenoDeps/mod.ts';
import { DenoFile } from '../../m.DenoFile/mod.ts';
import { applyDenoImports } from '../mod.ts';

describe('m.runtime/u', () => {
  describe('applyDenoImports', () => {
    it('writes inline imports when no importMap is declared', async () => {
      const fs = await Testing.dir('m.runtime.u.applyDenoImports.inline');
      const denoPath = fs.join('deno.json');
      const dep = DenoDeps.toDep('jsr:@std/path@1.0.8', { target: 'deno.json' });

      await Fs.writeJson(denoPath, { name: 'inline-app', tasks: { dev: 'deno task dev' } });

      const res = await applyDenoImports(denoPath, [dep]);
      const file = await DenoFile.load(denoPath);

      expect(res.kind).to.eql('imports');
      expect(res.targetPath).to.eql(denoPath);
      expect(file.data?.tasks).to.eql({ dev: 'deno task dev' });
      expect(file.data?.imports).to.eql({
        '@std/path': 'jsr:@std/path@1.0.8',
      });
    });

    it('writes to the referenced importMap file when configured', async () => {
      const fs = await Testing.dir('m.runtime.u.applyDenoImports.importMap');
      const denoPath = fs.join('deno.json');
      const importMapPath = fs.join('config/imports.json');
      const dep = DenoDeps.toDep('jsr:@std/path@1.0.8', { target: 'deno.json' });

      await Fs.writeJson(denoPath, {
        name: 'import-map-app',
        importMap: './config/imports.json',
        tasks: { dev: 'deno task dev' },
      });

      const res = await applyDenoImports(denoPath, [dep]);
      const file = await DenoFile.load(denoPath);
      const importMap = await Fs.readJson<{ imports?: Record<string, string> }>(importMapPath);

      expect(res.kind).to.eql('importMap');
      expect(res.targetPath).to.eql(importMapPath);
      expect(file.data?.importMap).to.eql('./config/imports.json');
      expect(file.data?.tasks).to.eql({ dev: 'deno task dev' });
      expect(file.data?.imports).to.eql(undefined);
      expect(importMap.data).to.eql({
        imports: {
          '@std/path': 'jsr:@std/path@1.0.8',
        },
      });
    });

    it('prefers importMap over inline imports when both are present', async () => {
      const fs = await Testing.dir('m.runtime.u.applyDenoImports.preferImportMap');
      const denoPath = fs.join('deno.json');
      const importMapPath = fs.join('imports.json');
      const dep = DenoDeps.toDep('jsr:@std/path@1.0.8', { target: 'deno.json' });

      await Fs.writeJson(denoPath, {
        name: 'dual-app',
        importMap: './imports.json',
        imports: { stale: 'jsr:@std/fmt@1.0.0' },
      });

      const res = await applyDenoImports(denoPath, [dep]);
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
  });
});
