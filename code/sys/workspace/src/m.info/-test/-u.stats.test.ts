import { describe, expect, Fs, it, Testing } from '../../-test.ts';
import { WorkspaceInfo } from '../mod.ts';

describe(`Workspace.Info.stats`, () => {
  it('counts files from explicit include globs', async () => {
    const fs = await Testing.dir('WorkspaceInfo.stats.files');

    await Fs.write(fs.join('code/a.ts'), 'export const a = 1;\n');
    await Fs.write(fs.join('code/b.tsx'), 'export const b = 2;\n');
    await Fs.write(fs.join('code/c.md'), '# no\n');

    const result = await WorkspaceInfo.stats({
      cwd: fs.dir,
      source: { include: ['code/**/*.{ts,tsx}'] },
    });

    expect(result.runtime.deno).to.eql(Deno.version.deno);
    expect(result.runtime.typescript).to.eql(Deno.version.typescript);
    expect(result.runtime.v8).to.eql(Deno.version.v8);
    expect(result.files).to.eql(2);
    expect(result.lines).to.eql(undefined);
    expect(result.lineBreakdown).to.eql(undefined);
    expect(result.source).to.eql({ include: ['code/**/*.{ts,tsx}'], exclude: [] });
  });

  it('applies exclude globs during discovery', async () => {
    const fs = await Testing.dir('WorkspaceInfo.stats.exclude');

    await Fs.write(fs.join('code/src/a.ts'), 'export const a = 1;\n');
    await Fs.write(fs.join('code/.tmp/b.ts'), 'export const b = 2;\n');
    await Fs.write(fs.join('code/node_modules/c.ts'), 'export const c = 3;\n');

    const result = await WorkspaceInfo.stats({
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

  it('deduplicates files matched by multiple include globs', async () => {
    const fs = await Testing.dir('WorkspaceInfo.stats.dedupe');

    await Fs.write(fs.join('code/src/a.ts'), 'export const a = 1;\n');
    await Fs.write(fs.join('code/src/b.tsx'), 'export const b = 2;\n');

    const result = await WorkspaceInfo.stats({
      cwd: fs.dir,
      source: { include: ['code/**/*.ts', 'code/**/*.{ts,tsx}'] },
      totals: { lines: true },
    });

    expect(result.files).to.eql(2);
    expect(result.lines).to.eql(4);
    expect(result.lineBreakdown).to.eql({ source: 4, tests: 0 });
    expect(result.source).to.eql({
      include: ['code/**/*.ts', 'code/**/*.{ts,tsx}'],
      exclude: [],
    });
  });

  it('preserves physical line count semantics', async () => {
    const fs = await Testing.dir('WorkspaceInfo.stats.line-semantics');

    await Fs.write(fs.join('code/empty.ts'), '');
    await Fs.write(fs.join('code/no-eof.ts'), 'a');
    await Fs.write(fs.join('code/trailing.ts'), 'a\n');
    await Fs.write(fs.join('code/multi.ts'), 'a\nb\n');

    const result = await WorkspaceInfo.stats({
      cwd: fs.dir,
      source: { include: ['code/**/*.ts'] },
      totals: { lines: true },
    });

    expect(result.files).to.eql(4);
    expect(result.lines).to.eql(7);
    expect(result.lineBreakdown).to.eql({ source: 7, tests: 0 });
  });

  it('partitions line totals into source and tests', async () => {
    const fs = await Testing.dir('WorkspaceInfo.stats.line-breakdown');

    await Fs.write(fs.join('code/src/source.ts'), 's\n');
    await Fs.write(fs.join('code/src/foo.test.ts'), 'a\nb');
    await Fs.write(fs.join('code/src/foo-test.ts'), 'c\n');
    await Fs.write(fs.join('code/src/foo_test.tsx'), 'd');
    await Fs.write(fs.join('code/src/.test.ts'), 'e\n');
    await Fs.write(fs.join('code/src/-test.ts'), 'f');
    await Fs.write(fs.join('code/src/-test/helper.ts'), 'g\nh\n');
    await Fs.write(fs.join('code/src/m.foo/-test.external/fixture.ts'), '');
    await Fs.write(fs.join('code/src/__tests__/fixture.tsx'), 'i\n');
    await Fs.write(fs.join('code/sys/testing/src/mod.ts'), 'j\n');

    const result = await WorkspaceInfo.stats({
      cwd: fs.dir,
      source: { include: ['code/**/*.{ts,tsx}'] },
      totals: { lines: true },
    });

    expect(result.files).to.eql(10);
    expect(result.lines).to.eql(18);
    expect(result.lineBreakdown).to.eql({ source: 4, tests: 14 });
    expect(result.lines).to.eql(
      (result.lineBreakdown?.source ?? 0) + (result.lineBreakdown?.tests ?? 0),
    );
  });

  it('computes line totals when requested', async () => {
    const fs = await Testing.dir('WorkspaceInfo.stats.lines');

    await Fs.write(fs.join('code/a.ts'), 'a\nb\n');
    await Fs.write(fs.join('code/b.tsx'), 'c\n');

    const result = await WorkspaceInfo.stats({
      cwd: fs.dir,
      source: { include: ['code/**/*.{ts,tsx}'] },
      totals: { lines: true },
    });

    expect(result.files).to.eql(2);
    expect(result.lines).to.eql(5);
    expect(result.lineBreakdown).to.eql({ source: 5, tests: 0 });
  });
});
