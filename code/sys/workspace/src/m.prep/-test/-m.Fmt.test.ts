import { Cli, describe, expect, it } from '../../-test.ts';
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
      [
        'Workspace import map',
        ' (47 dependencies written to): imports.json',
      ].join('\n'),
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
      [
        'Workspace import map',
        ' (47 dependencies written to):',
        '  - imports.json',
        '  - package.json',
      ].join('\n'),
    );
  });
});
