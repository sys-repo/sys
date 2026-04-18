import { Cli, describe, expect, it, Str } from '../../-test.ts';
import { WorkspacePrep } from '../mod.ts';

describe('Workspace.Prep.Fmt', () => {
  it('formats a single import-map output path on one line with a cwd-trimmed graph path', () => {
    const text = Cli.stripAnsi(
      WorkspacePrep.Fmt.importMap({
        cwd: '/repo',
        total: 47,
        paths: ['/repo/imports.json'],
      }),
    );

    expect(text).to.eql(
      Str.dedent(`
        Workspace import map
        47 dependencies written to: imports.json
      `),
    );
  });

  it('formats multiple import-map output paths as a cwd-trimmed bullet list', () => {
    const text = Cli.stripAnsi(
      WorkspacePrep.Fmt.importMap({
        cwd: '/repo',
        total: 47,
        paths: ['/repo/imports.json', '/repo/package.json'],
      }),
    );

    expect(text).to.eql(
      Str.dedent(`
        Workspace import map
        47 dependencies written to:
          - imports.json
          - package.json
      `),
    );
  });

  it('formats a deps sync result without rebuilding the output paths in callers', () => {
    const text = Cli.stripAnsi(
      WorkspacePrep.Fmt.importMapSync({
        cwd: '/repo',
        result: {
          total: 47,
          depsPath: '/repo/deps.yaml',
          deno: {
            kind: 'importMap',
            denoFilePath: '/repo/deno.json',
            targetPath: '/repo/imports.json',
            imports: {},
          },
          package: {
            packageFilePath: '/repo/package.json',
            dependencies: {},
            devDependencies: {},
          },
        },
      }),
    );

    expect(text).to.eql(
      Str.dedent(`
        Workspace import map
        47 dependencies written to:
          - imports.json
          - package.json
      `),
    );
  });
});
