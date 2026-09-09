import { describe, expect, Fs, it } from '../-test.ts';
import { Process, type t } from '../common.ts';
import { TmplTool } from './t.ts';
import * as TmplTools from './mod.ts';
import { cliTmplWith, type TmplCliDeps } from './u.run.ts';

describe(TmplTool.NAME, () => {
  it('exposes canonical tool metadata', () => {
    type Id = t.TmplTool.Id;
    type Name = t.TmplTool.Name;

    const id: Id = TmplTool.ID;
    const name: Name = TmplTool.NAME;

    expect(id).to.eql('tmpl');
    expect(name).to.eql('system/tmpl:tools');
  });

  it('API', async () => {
    const m = await import('@sys/tools/tmpl');
    expect(m.cli).to.equal(TmplTools.cli);
  });

  it('outside @sys monorepo delegates argv and cwd to jsr:@sys/tmpl', async () => {
    type InheritArgs = Parameters<typeof Process.inherit>[0];
    const calls: InheritArgs[] = [];

    await run(
      false,
      '/tmp/tool-cwd',
      ['pkg.deno', '--dir', 'code/ns/foo', '--non-interactive'],
      async (config) => {
        calls.push(config);
        return { code: 0, success: true, signal: null };
      },
    );

    expect(calls.length).to.eql(1);
    expect(calls[0]?.cwd).to.eql('/tmp/tool-cwd');
    expect(calls[0]?.args?.[0]).to.eql('run');
    expect(calls[0]?.args?.[1]).to.eql('-ERW');
    expect(calls[0]?.args?.[2]).to.match(/^jsr:@sys\/tmpl@/);
    expect(calls[0]?.args?.slice(3)).to.eql([
      'pkg.deno',
      '--dir',
      'code/ns/foo',
      '--non-interactive',
    ]);
  });

  it('inside @sys monorepo delegates to @sys/tmpl (no jsr prefix)', async () => {
    type InheritArgs = Parameters<typeof Process.inherit>[0];
    const calls: InheritArgs[] = [];

    await run(true, '/tmp/tool-cwd', ['-h'], async (config) => {
      calls.push(config);
      return { code: 0, success: true, signal: null };
    });

    expect(calls.length).to.eql(1);
    expect(calls[0]?.args).to.eql(['run', '-ERW', '@sys/tmpl', '-h']);
  });

  it('propagates non-zero delegated exit via Deno.exitCode', async () => {
    await withExitCode(0, async () => {
      await run(
        false,
        '/tmp/tool-cwd',
        [],
        () => Promise.resolve({ code: 9, success: false, signal: null }),
      );

      expect(Deno.exitCode).to.eql(9);
    });
  });

  it('falls back to jsr:@sys/tmpl when workspace root is not /sys', async () => {
    type InheritArgs = Parameters<typeof Process.inherit>[0];
    const calls: InheritArgs[] = [];

    await run(false, '/tmp/tool-cwd', ['-h'], async (config) => {
      calls.push(config);
      return { code: 0, success: true, signal: null };
    });

    expect(calls.length).to.eql(1);
    expect(calls[0]?.args?.[0]).to.eql('run');
    expect(calls[0]?.args?.[1]).to.eql('-ERW');
    expect(calls[0]?.args?.[2]).to.match(/^jsr:@sys\/tmpl@/);
    expect(calls[0]?.args?.slice(3)).to.eql(['-h']);
  });
});

async function run(
  local: boolean,
  cwd: string,
  argv: string[],
  inherit: TmplCliDeps['inherit'],
) {
  await cliTmplWith(cwd, argv, {
    inherit,
    resolveContext: ({ cwd, target }) =>
      Promise.resolve({
        cwd,
        mode: local ? 'local' : 'published',
        reason: local ? 'system-workspace' : 'workspace-mismatch',
        specifier: local ? target.localSpecifier : target.publishedSpecifier,
        target,
      }),
  });
}

async function withExitCode(value: number, run: () => Promise<void>) {
  const previous = Deno.exitCode;
  try {
    Deno.exitCode = value;
    await run();
  } finally {
    Deno.exitCode = previous;
  }
}
