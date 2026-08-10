import { Cli, describe, expect, expectTypeOf, it, Str, type t } from '../../-test.ts';
import { WorkspaceInfo } from '../mod.ts';

describe(`Workspace.Info`, () => {
  it('API', async () => {
    const m = await import('@sys/workspace/info');
    expect(m.WorkspaceInfo).to.equal(WorkspaceInfo);
    expect(WorkspaceInfo.DEFAULTS.testPathRules.length).to.eql(2);
    expectTypeOf(undefined as t.WorkspaceInfo.GlobArgs['packages'])
      .toEqualTypeOf<undefined>();
    expectTypeOf(undefined as t.WorkspaceInfo.GlobResult['packages'])
      .toEqualTypeOf<undefined>();
  });

  it('formats raw glob ownership and line branches', () => {
    const text = Cli.stripAnsi(WorkspaceInfo.fmt({
      kind: 'glob',
      runtime: { deno: '2.7.4', typescript: '5.9.2', v8: '14.x' },
      source: { include: ['code/**/*.{ts,tsx}'], exclude: [] },
      files: 12,
      lines: 123,
      lineBreakdown: { source: 111, unitTests: 10, uiSpecTests: 2 },
    }));

    expect(text).to.eql(
      Str.dedent(`
      |
        Deno.version   2.7.4
          typescript   5.9.2
                  v8   14.x
        ↓
        Workspace
        pattern.code   code/**/*.{ts,tsx}
               files   12
               lines   123
                       ├─ source code   111
                       ├─ unit test      10
                       └─ ui harness      2
    `).slice(2),
    );
  });

  it('formats package ownership from the selected result', () => {
    const text = Cli.stripAnsi(WorkspaceInfo.fmt({
      kind: 'package',
      runtime: { deno: '2.7.4', typescript: '5.9.2', v8: '14.x' },
      selection: { workspace: './deno.json', scope: '@sys' },
      packages: [
        { name: '@sys/a', path: 'code/a' },
        { name: '@sys/b', path: 'code/b' },
        { name: '@sys/c', path: 'code/c' },
      ],
      source: { include: ['**/*.{ts,tsx}'], exclude: [] },
      files: 12,
      lines: 123,
      lineBreakdown: { source: 111, unitTests: 10, uiSpecTests: 2 },
    }));

    expect(text).to.eql(
      Str.dedent(`
      |
        Deno.version   2.7.4
          typescript   5.9.2
                  v8   14.x
        ↓
        Workspace
          packages      3   @sys/*
             files      12
             lines      123
                     ├─ source code   111
                     ├─ unit test      10
                     └─ ui harness      2
    `).slice(2),
    );
    expect(text.includes('pattern.code')).to.eql(false);
    expect(text.includes('**/*.{ts,tsx}')).to.eql(false);
  });

  it('omits line branches when no package line breakdown exists', () => {
    const text = Cli.stripAnsi(WorkspaceInfo.fmt({
      kind: 'package',
      runtime: { deno: '2.7.4', typescript: '5.9.2', v8: '14.x' },
      selection: { workspace: './deno.json', scope: '@sys' },
      packages: [{ name: '@sys/a', path: 'code/a' }],
      source: { include: ['**/*.ts'], exclude: [] },
      files: 1,
    }));

    expect(text.includes('├─')).to.eql(false);
    expect(text.includes('└─')).to.eql(false);
  });
});
