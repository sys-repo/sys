import { describe, expect, Fs, it, Testing } from '../../../-test.ts';
import { DenoDeps } from '../mod.ts';

describe('DenoDeps.verifyDeno', () => {
  it('passes when projected imports satisfy source specifiers', async () => {
    const fs = await Testing.dir('DenoDeps.verifyProjectedImports.ok');
    const denoPath = fs.join('deno.json');
    const importsPath = fs.join('imports.json');
    const aliasedPath = fs.join('src/dep.ts');
    const sourcePath = fs.join('src/mod.ts');

    await Fs.writeJson(denoPath, { name: 'verify-ok', importMap: './imports.json' });
    await Fs.writeJson(importsPath, { imports: { '@test/dep': './src/dep.ts' } });
    await Fs.write(aliasedPath, 'export const dep = 123;');
    await Fs.write(sourcePath, "import { dep } from '@test/dep';\nconsole.info(dep);\n");

    const res = await DenoDeps.verifyDeno({
      cwd: fs.dir,
      include: ['src/**/*.ts'],
    });

    expect(res.cwd).to.eql(fs.dir);
    expect(res.configPath).to.eql(denoPath);
    expect(res.paths).to.eql([aliasedPath, sourcePath]);
  });

  it('fails when a source specifier is missing from the projected imports', async () => {
    const fs = await Testing.dir('DenoDeps.verifyProjectedImports.fail');
    const denoPath = fs.join('deno.json');
    const importsPath = fs.join('imports.json');
    const sourcePath = fs.join('src/mod.ts');

    await Fs.writeJson(denoPath, { name: 'verify-fail', importMap: './imports.json' });
    await Fs.writeJson(importsPath, { imports: {} });
    await Fs.write(sourcePath, "import type { Missing } from '@test/missing';\nexport type { Missing };\n");

    let error: Error | undefined;
    try {
      await DenoDeps.verifyDeno({
        cwd: fs.dir,
        include: ['src/**/*.ts'],
      });
    } catch (cause) {
      error = cause as Error;
    }

    expect(error).to.not.eql(undefined);
    expect(error?.message).to.include('Projected Deno imports do not satisfy source specifiers.');
    expect(error?.message).to.include('@test/missing');
    expect(error?.message).to.include(sourcePath);
  });
});
