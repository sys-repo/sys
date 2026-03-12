import { describe, expect, Fs, it, Testing } from '../../-test.ts';
import { MonorepoInfo } from '../mod.ts';

describe(`Monorepo.Info.stats`, () => {
  it('counts files from explicit include globs', async () => {
    const fs = await Testing.dir('MonorepoInfo.stats.files').create();

    await Fs.write(fs.join('code/a.ts'), 'export const a = 1;\n');
    await Fs.write(fs.join('code/b.tsx'), 'export const b = 2;\n');
    await Fs.write(fs.join('code/c.md'), '# no\n');

    const result = await MonorepoInfo.stats({
      cwd: fs.dir,
      source: { include: ['code/**/*.{ts,tsx}'] },
    });

    expect(result.runtime.deno).to.eql(Deno.version.deno);
    expect(result.runtime.typescript).to.eql(Deno.version.typescript);
    expect(result.runtime.v8).to.eql(Deno.version.v8);
    expect(result.files).to.eql(2);
    expect(result.lines).to.eql(undefined);
    expect(result.source).to.eql({ include: ['code/**/*.{ts,tsx}'], exclude: [] });
  });

  it('applies exclude globs during discovery', async () => {
    const fs = await Testing.dir('MonorepoInfo.stats.exclude').create();

    await Fs.write(fs.join('code/src/a.ts'), 'export const a = 1;\n');
    await Fs.write(fs.join('code/.tmp/b.ts'), 'export const b = 2;\n');
    await Fs.write(fs.join('code/node_modules/c.ts'), 'export const c = 3;\n');

    const result = await MonorepoInfo.stats({
      cwd: fs.dir,
      source: {
        include: ['code/**/*.ts'],
        exclude: ['**/.tmp/**', '**/node_modules/**'],
      },
    });

    expect(result.files).to.eql(1);
    expect(result.source).to.eql({
      include: ['code/**/*.ts'],
      exclude: ['**/.tmp/**', '**/node_modules/**'],
    });
  });

  it('computes line totals when requested', async () => {
    const fs = await Testing.dir('MonorepoInfo.stats.lines').create();

    await Fs.write(fs.join('code/a.ts'), 'a\nb\n');
    await Fs.write(fs.join('code/b.tsx'), 'c\n');

    const result = await MonorepoInfo.stats({
      cwd: fs.dir,
      source: { include: ['code/**/*.{ts,tsx}'] },
      totals: { lines: true },
    });

    expect(result.files).to.eql(2);
    expect(result.lines).to.eql(5);
  });
});
