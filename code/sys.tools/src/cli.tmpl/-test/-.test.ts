import { describe, expect, it } from '../../-test.ts';
import { D } from '../common.ts';
import { Process, type t } from '../common.ts';
import { cli } from '../m.cli.ts';

describe('tool: Tmpl', () => {
  it('exposes canonical tool metadata', () => {
    type Id = t.TmplTool.Id;
    type Name = t.TmplTool.Name;

    const id: Id = D.tool.id;
    const name: Name = D.tool.name;

    expect(id).to.eql('tmpl');
    expect(name).to.eql('system/tmpl:tools');
  });

  it('delegates argv and cwd to @sys/tmpl', async () => {
    type InheritArgs = Parameters<typeof Process.inherit>[0];
    const calls: InheritArgs[] = [];

    await withInheritStub(async (config) => {
        calls.push(config);
        return { code: 0, success: true, signal: null };
      }, async () => {
        await cli('/tmp/tool-cwd', ['pkg.deno', '--dir', 'code/ns/foo', '--no-interactive']);
      });

    expect(calls.length).to.eql(1);
    expect(calls[0]?.cwd).to.eql('/tmp/tool-cwd');
    expect(calls[0]?.args).to.eql([
      'run',
      '-A',
      'jsr:@sys/tmpl',
      'pkg.deno',
      '--dir',
      'code/ns/foo',
      '--no-interactive',
    ]);
  });

  it('propagates non-zero delegated exit via Deno.exitCode', async () => {
    await withExitCode(0, async () => {
      await withInheritStub(async () => {
        return { code: 9, success: false, signal: null };
      }, async () => {
        await cli('/tmp/tool-cwd', []);
      });

      expect(Deno.exitCode).to.eql(9);
    });
  });
});

/**
 * Helpers:
 */

type Inherit = typeof Process.inherit;
type InheritStub = Parameters<Inherit>[0] extends infer A
  ? (config: A) => ReturnType<Inherit>
  : never;

async function withInheritStub(stub: InheritStub, run: () => Promise<void>) {
  const original = Process.inherit;
  try {
    (Process as unknown as { inherit: typeof Process.inherit }).inherit = stub;
    await run();
  } finally {
    (Process as unknown as { inherit: typeof Process.inherit }).inherit = original;
  }
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
