import { describe, expect, expectError, Fs, it, Testing } from '../../-test.ts';
import { WorkspaceInfo } from '../mod.ts';
import { rootPackagePatterns } from '../u.stats.ts';

describe(`Workspace.Info.stats`, () => {
  it('counts files from explicit include globs', async () => {
    const fs = await Testing.dir('WorkspaceInfo.stats.files');

    await Fs.write(fs.join('code/a.ts'), 'export const a = 1;\n');
    await Fs.write(fs.join('code/b.tsx'), 'export const b = 2;\n');
    await Fs.write(fs.join('code/c.md'), '# no\n');

    const result = await WorkspaceInfo.stats({
      cwd: fs.dir,
      source: { kind: 'glob', include: ['code/**/*.{ts,tsx}'] },
    });

    expect(result.kind).to.eql('glob');
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
        kind: 'glob',
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
      source: { kind: 'glob', include: ['code/**/*.ts', 'code/**/*.{ts,tsx}'] },
      totals: { lines: true },
    });

    expect(result.files).to.eql(2);
    expect(result.lines).to.eql(4);
    expect(result.lineBreakdown).to.eql({ source: 4, unitTests: 0, uiSpecTests: 0 });
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
      source: { kind: 'glob', include: ['code/**/*.ts'] },
      totals: { lines: true },
    });

    expect(result.files).to.eql(4);
    expect(result.lines).to.eql(7);
    expect(result.lineBreakdown).to.eql({ source: 7, unitTests: 0, uiSpecTests: 0 });
  });

  it('partitions line totals into source, unit tests, and ui spec tests', async () => {
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
    await Fs.write(fs.join('code/src/-spec/-SPEC.tsx'), 'k\nl');
    await Fs.write(fs.join('code/src/-spec/common.ts'), 'm\n');
    await Fs.write(fs.join('code/src/-spec.debug/fixture.tsx'), '');
    await Fs.write(fs.join('code/sys/testing/src/mod.ts'), 'j\n');

    const result = await WorkspaceInfo.stats({
      cwd: fs.dir,
      source: { kind: 'glob', include: ['code/**/*.{ts,tsx}'] },
      totals: { lines: true },
    });

    expect(result.files).to.eql(13);
    expect(result.lines).to.eql(23);
    expect(result.lineBreakdown).to.eql({ source: 4, unitTests: 14, uiSpecTests: 5 });
    expect(result.lines).to.eql(
      (result.lineBreakdown?.source ?? 0) +
        (result.lineBreakdown?.unitTests ?? 0) +
        (result.lineBreakdown?.uiSpecTests ?? 0),
    );
  });

  it('computes line totals when requested', async () => {
    const fs = await Testing.dir('WorkspaceInfo.stats.lines');

    await Fs.write(fs.join('code/a.ts'), 'a\nb\n');
    await Fs.write(fs.join('code/b.tsx'), 'c\n');

    const result = await WorkspaceInfo.stats({
      cwd: fs.dir,
      source: { kind: 'glob', include: ['code/**/*.{ts,tsx}'] },
      totals: { lines: true },
    });

    expect(result.files).to.eql(2);
    expect(result.lines).to.eql(5);
    expect(result.lineBreakdown).to.eql({ source: 5, unitTests: 0, uiSpecTests: 0 });
  });

  describe('package mode', () => {
    it('selects listed packages by scope and orders identities by name', async () => {
      const fs = await Testing.dir('WorkspaceInfo.stats.packages');
      await writeWorkspace(fs.dir, ['code/z', 'code/other', 'code/a', 'code/zero']);
      await writePackage(fs.dir, 'code/z', '@sys/z');
      await writePackage(fs.dir, 'code/other', '@other/pkg');
      await writePackage(fs.dir, 'code/a', '@sys/a');
      await writePackage(fs.dir, 'code/zero', '@sys/zero');
      await writePackage(fs.dir, 'code/unlisted', '@sys/unlisted');
      await Fs.write(fs.join('code/z/z.ts'), 'z\n');
      await Fs.write(fs.join('code/other/other.ts'), 'other\n');
      await Fs.write(fs.join('code/a/a.ts'), 'a\n');
      await Fs.write(fs.join('code/unlisted/unlisted.ts'), 'unlisted\n');

      const result = await WorkspaceInfo.stats({
        cwd: fs.dir,
        packages: { workspace: './deno.json', scope: '@sys' },
        source: { kind: 'package', include: ['**/*.ts'] },
        totals: { lines: true },
      });

      expect(result.kind).to.eql('package');
      if (result.kind !== 'package') throw new Error('Expected package result');
      expect(result.selection).to.eql({ workspace: './deno.json', scope: '@sys' });
      expect(result.packages).to.eql([
        { name: '@sys/a', path: 'code/a' },
        { name: '@sys/z', path: 'code/z' },
        { name: '@sys/zero', path: 'code/zero' },
      ]);
      expect(result.source).to.eql({ include: ['**/*.ts'], exclude: [] });
      expect(result.files).to.eql(2);
      expect(result.lines).to.eql(4);
      expect(result.lineBreakdown).to.eql({ source: 4, unitTests: 0, uiSpecTests: 0 });
    });

    it('roots package-relative exclusions beneath each selected package', async () => {
      const fs = await Testing.dir('WorkspaceInfo.stats.package-excludes');
      await writeWorkspace(fs.dir, ['code/a', 'code/b']);
      await writePackage(fs.dir, 'code/a', '@sys/a');
      await writePackage(fs.dir, 'code/b', '@sys/b');

      for (const path of ['code/a', 'code/b']) {
        await Fs.write(fs.join(path, 'src/main.ts'), 'main\n');
        await Fs.write(fs.join(path, '.tmp/cache.ts'), 'tmp\n');
        await Fs.write(fs.join(path, '.pi/cache.ts'), 'pi\n');
        await Fs.write(fs.join(path, 'node_modules/dep.ts'), 'dep\n');
        await Fs.write(fs.join(path, 'src/generated/skip.ts'), 'skip\n');
      }

      const source = {
        include: ['**/*.ts'],
        exclude: ['**/.tmp/**', '**/.pi/**', '**/node_modules/**', '**/generated/**'],
      } as const;
      const packageRoot = fs.join('code/a');
      const rooted = rootPackagePatterns(packageRoot, source);
      expect(rooted.exclude).to.eql(source.exclude.map((path) => Fs.resolve(packageRoot, path)));

      const result = await WorkspaceInfo.stats({
        cwd: fs.dir,
        packages: { workspace: './deno.json', scope: '@sys' },
        source: { kind: 'package', ...source },
      });

      expect(result.files).to.eql(2);
      expect(result.source).to.eql(source);
    });

    it('does not treat package manifest excludes as source ownership', async () => {
      const fs = await Testing.dir('WorkspaceInfo.stats.package-manifest-exclude');
      await writeWorkspace(fs.dir, ['code/a']);
      await Fs.writeJson(fs.join('code/a/deno.json'), {
        name: '@sys/a',
        version: '1.0.0',
        exclude: ['src/owned.ts'],
      });
      await Fs.write(fs.join('code/a/src/owned.ts'), 'owned\n');

      const result = await WorkspaceInfo.stats({
        cwd: fs.dir,
        packages: { workspace: './deno.json', scope: '@sys' },
        source: { kind: 'package', include: ['**/*.ts'] },
      });

      expect(result.files).to.eql(1);
    });

    it('deduplicates overlapping package includes and preserves line arithmetic', async () => {
      const fs = await Testing.dir('WorkspaceInfo.stats.package-dedupe');
      await writeWorkspace(fs.dir, ['code/a']);
      await writePackage(fs.dir, 'code/a', '@sys/a');
      await Fs.write(fs.join('code/a/src/a.ts'), 'a\nb\n');
      await Fs.write(fs.join('code/a/src/a.test.ts'), 'test\n');

      const result = await WorkspaceInfo.stats({
        cwd: fs.dir,
        packages: { workspace: './deno.json', scope: '@sys' },
        source: { kind: 'package', include: ['**/*.ts', 'src/**/*.{ts,tsx}'] },
        totals: { lines: true },
      });

      expect(result.files).to.eql(2);
      expect(result.lines).to.eql(5);
      expect(result.lineBreakdown).to.eql({ source: 3, unitTests: 2, uiSpecTests: 0 });
    });

    it('rejects malformed scopes and an empty package selection', async () => {
      const fs = await Testing.dir('WorkspaceInfo.stats.package-scope');
      await writeWorkspace(fs.dir, ['code/a']);
      await writePackage(fs.dir, 'code/a', '@other/a');

      for (const scope of ['', 'sys', '@sys/', '@Sys', '@sys/tools']) {
        await expectError(
          () =>
            WorkspaceInfo.stats({
              cwd: fs.dir,
              packages: { workspace: './deno.json', scope },
              source: { kind: 'package', include: ['**/*.ts'] },
            }),
          'Package scope is invalid',
        );
      }

      await expectError(
        () =>
          WorkspaceInfo.stats({
            cwd: fs.dir,
            packages: { workspace: './deno.json', scope: '@sys' },
            source: { kind: 'package', include: ['**/*.ts'] },
          }),
        'No workspace packages match scope: @sys',
      );
    });

    it('rejects malformed selected names and duplicate selected names', async () => {
      const malformed = await Testing.dir('WorkspaceInfo.stats.package-name');
      await writeWorkspace(malformed.dir, ['code/a']);
      await writePackage(malformed.dir, 'code/a', '@sys/a/nested');
      await expectError(
        () =>
          WorkspaceInfo.stats({
            cwd: malformed.dir,
            packages: { workspace: './deno.json', scope: '@sys' },
            source: { kind: 'package', include: ['**/*.ts'] },
          }),
        'Selected package name is invalid',
      );

      const duplicate = await Testing.dir('WorkspaceInfo.stats.package-duplicate-name');
      await writeWorkspace(duplicate.dir, ['code/a', 'code/b']);
      await writePackage(duplicate.dir, 'code/a', '@sys/same');
      await writePackage(duplicate.dir, 'code/b', '@sys/same');
      await expectError(
        () =>
          WorkspaceInfo.stats({
            cwd: duplicate.dir,
            packages: { workspace: './deno.json', scope: '@sys' },
            source: { kind: 'package', include: ['**/*.ts'] },
          }),
        'Duplicate selected package name: @sys/same',
      );
    });

    it('rejects duplicate, nested, and symlinked selected roots', async () => {
      const duplicate = await Testing.dir('WorkspaceInfo.stats.package-duplicate-root');
      await writeWorkspace(duplicate.dir, ['code/a', 'code/./a']);
      await writePackage(duplicate.dir, 'code/a', '@sys/a');
      await expectError(
        () =>
          WorkspaceInfo.stats({
            cwd: duplicate.dir,
            packages: { workspace: './deno.json', scope: '@sys' },
            source: { kind: 'package', include: ['**/*.ts'] },
          }),
        'Duplicate selected package root',
      );

      const nested = await Testing.dir('WorkspaceInfo.stats.package-nested-root');
      await writeWorkspace(nested.dir, ['code/a', 'code/a/nested']);
      await writePackage(nested.dir, 'code/a', '@sys/a');
      await writePackage(nested.dir, 'code/a/nested', '@sys/nested');
      await expectError(
        () =>
          WorkspaceInfo.stats({
            cwd: nested.dir,
            packages: { workspace: './deno.json', scope: '@sys' },
            source: { kind: 'package', include: ['**/*.ts'] },
          }),
        'Selected package roots must not be nested',
      );

      const symlink = await Testing.dir('WorkspaceInfo.stats.package-symlink-root');
      await writeWorkspace(symlink.dir, ['code/real', 'code/link']);
      await writePackage(symlink.dir, 'code/real', '@sys/real');
      await Deno.symlink(symlink.join('code/real'), symlink.join('code/link'), { type: 'dir' });
      await expectError(
        () =>
          WorkspaceInfo.stats({
            cwd: symlink.dir,
            packages: { workspace: './deno.json', scope: '@sys' },
            source: { kind: 'package', include: ['**/*.ts'] },
          }),
        'Selected package root must not be a symlink: code/link',
      );

      const ancestor = await Testing.dir('WorkspaceInfo.stats.package-symlink-root-ancestor');
      await writeWorkspace(ancestor.dir, ['code/alias/pkg']);
      await writePackage(ancestor.dir, 'code/real/pkg', '@sys/alias');
      await Deno.symlink(ancestor.join('code/real'), ancestor.join('code/alias'), { type: 'dir' });
      await expectError(
        () =>
          WorkspaceInfo.stats({
            cwd: ancestor.dir,
            packages: { workspace: './deno.json', scope: '@sys' },
            source: { kind: 'package', include: ['**/*.ts'] },
          }),
        'Selected package root must not be a symlink: code/alias/pkg',
      );
    });

    it('rejects unsafe package-relative patterns', async () => {
      const fs = await Testing.dir('WorkspaceInfo.stats.package-patterns');
      await writeWorkspace(fs.dir, ['code/a']);
      await writePackage(fs.dir, 'code/a', '@sys/a');

      const cases = [
        { include: [fs.join('outside/*.ts')], exclude: [] },
        { include: ['C:outside/*.ts'], exclude: [] },
        { include: ['\\outside\\*.ts'], exclude: [] },
        { include: ['../outside/*.ts'], exclude: [] },
        { include: ['!**/*.test.ts'], exclude: [] },
        { include: ['**/*.ts'], exclude: ['../outside/**'] },
        { include: ['**/*.ts'], exclude: ['!src/**'] },
      ];
      for (const source of cases) {
        await expectError(
          () =>
            WorkspaceInfo.stats({
              cwd: fs.dir,
              packages: { workspace: './deno.json', scope: '@sys' },
              source: { kind: 'package', ...source },
            }),
          'Package source pattern',
        );
      }
    });

    it('validates package policy before workspace IO', async () => {
      const fs = await Testing.dir('WorkspaceInfo.stats.package-validation-order');

      await expectError(
        () =>
          WorkspaceInfo.stats({
            cwd: fs.dir,
            packages: { workspace: './missing.json', scope: 'sys' },
            source: { kind: 'package', include: ['**/*.ts'] },
          }),
        'Package scope is invalid: sys',
      );
      await expectError(
        () =>
          WorkspaceInfo.stats({
            cwd: fs.dir,
            packages: { workspace: './missing.json', scope: '@sys' },
            source: { kind: 'package', include: ['../outside/*.ts'] },
          }),
        'Package source pattern must not traverse',
      );
    });

    it('rejects unsafe workspace manifest selectors', async () => {
      const fs = await Testing.dir('WorkspaceInfo.stats.package-workspace-path');
      const outside = await Testing.dir('WorkspaceInfo.stats.package-workspace-path.outside');
      await writeWorkspace(outside.dir, ['code/a']);
      await writePackage(outside.dir, 'code/a', '@sys/a');

      await expectError(
        () =>
          WorkspaceInfo.stats({
            cwd: fs.dir,
            packages: { workspace: fs.join('deno.json'), scope: '@sys' },
            source: { kind: 'package', include: ['**/*.ts'] },
          }),
        'Package workspace manifest path must be relative',
      );
      await expectError(
        () =>
          WorkspaceInfo.stats({
            cwd: fs.dir,
            packages: { workspace: '../outside/deno.json', scope: '@sys' },
            source: { kind: 'package', include: ['**/*.ts'] },
          }),
        'Package workspace manifest path escapes cwd',
      );
      await expectError(
        () =>
          WorkspaceInfo.stats({
            cwd: fs.dir,
            packages: { workspace: './missing.json', scope: '@sys' },
            source: { kind: 'package', include: ['**/*.ts'] },
          }),
        `Package workspace manifest could not be resolved: ${fs.join('missing.json')}`,
      );

      await Deno.symlink(outside.join('deno.json'), fs.join('linked.json'));
      await expectError(
        () =>
          WorkspaceInfo.stats({
            cwd: fs.dir,
            packages: { workspace: './linked.json', scope: '@sys' },
            source: { kind: 'package', include: ['**/*.ts'] },
          }),
        'Package workspace manifest path escapes cwd through symlink',
      );
    });

    it('does not traverse a symlinked directory outside the package root', async () => {
      const fs = await Testing.dir('WorkspaceInfo.stats.package-symlink-directory');
      const outside = await Testing.dir('WorkspaceInfo.stats.package-symlink-directory.outside');
      await writeWorkspace(fs.dir, ['code/a']);
      await writePackage(fs.dir, 'code/a', '@sys/a');
      await Fs.write(outside.join('secret.ts'), 'secret\n');
      await Deno.symlink(outside.dir, fs.join('code/a/linked'), { type: 'dir' });

      const result = await WorkspaceInfo.stats({
        cwd: fs.dir,
        packages: { workspace: './deno.json', scope: '@sys' },
        source: { kind: 'package', include: ['**/*.ts'] },
        totals: { lines: true },
      });

      expect(result.files).to.eql(0);
      expect(result.lines).to.eql(0);
    });

    it('ignores final-path symlinks without reading their targets', async () => {
      const fs = await Testing.dir('WorkspaceInfo.stats.package-symlink-file');
      const outside = await Testing.dir('WorkspaceInfo.stats.package-symlink-file.outside');
      await writeWorkspace(fs.dir, ['code/a']);
      await writePackage(fs.dir, 'code/a', '@sys/a');
      await Fs.write(outside.join('secret.ts'), 'secret\n');
      await Deno.symlink(outside.join('secret.ts'), fs.join('code/a/escape.ts'));

      const result = await WorkspaceInfo.stats({
        cwd: fs.dir,
        packages: { workspace: './deno.json', scope: '@sys' },
        source: { kind: 'package', include: ['**/*.ts'] },
        totals: { lines: true },
      });

      expect(result.files).to.eql(0);
      expect(result.lines).to.eql(0);
    });
  });
});

async function writeWorkspace(cwd: string, workspace: readonly string[]) {
  await Fs.writeJson(Fs.join(cwd, 'deno.json'), { workspace: [...workspace] });
}

async function writePackage(cwd: string, path: string, name: string) {
  await Fs.writeJson(Fs.join(cwd, path, 'deno.json'), { name, version: '1.0.0' });
}
