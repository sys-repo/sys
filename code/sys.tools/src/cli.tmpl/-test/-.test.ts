import { describe, expect, it } from '../../-test.ts';
import { D } from '../common.ts';
import { Process, type t } from '../common.ts';
import { cli } from '../m.cli.ts';
import { Fixture } from './-u.fixture.ts';

describe('tool: Tmpl', () => {
  it('exposes canonical tool metadata', () => {
    type Id = t.TmplTool.Id;
    type Name = t.TmplTool.Name;

    const id: Id = D.tool.id;
    const name: Name = D.tool.name;

    expect(id).to.eql('tmpl');
    expect(name).to.eql('system/tmpl:tools');
  });

  it('outside @sys monorepo delegates argv and cwd to jsr:@sys/tmpl', async () => {
    type InheritArgs = Parameters<typeof Process.inherit>[0];
    const calls: InheritArgs[] = [];

    await Fixture.withNearestStub(async () => Fixture.makeNearest(false), async () => {
      await Fixture.withWorkspaceStub(async () => Fixture.makeWorkspace(false), async () => {
        await Fixture.withInheritStub(async (config) => {
            calls.push(config);
            return { code: 0, success: true, signal: null };
          }, async () => {
            await cli('/tmp/tool-cwd', ['pkg.deno', '--dir', 'code/ns/foo', '--no-interactive']);
          });
      });
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

  it('inside @sys monorepo delegates to @sys/tmpl (no jsr prefix)', async () => {
    type InheritArgs = Parameters<typeof Process.inherit>[0];
    const calls: InheritArgs[] = [];
    await Fixture.withNearestStub(async () => Fixture.makeNearest(true), async () => {
      await Fixture.withWorkspaceStub(async () => Fixture.makeWorkspace(true), async () => {
        await Fixture.withInheritStub(async (config) => {
          calls.push(config);
          return { code: 0, success: true, signal: null };
        }, async () => {
          await cli('/tmp/tool-cwd', ['-h']);
        });
      });
    });

    expect(calls.length).to.eql(1);
    expect(calls[0]?.args).to.eql(['run', '-A', '@sys/tmpl', '-h']);
  });

  it('propagates non-zero delegated exit via Deno.exitCode', async () => {
    await withExitCode(0, async () => {
      await Fixture.withInheritStub(async () => {
        return { code: 9, success: false, signal: null };
      }, async () => {
        await cli('/tmp/tool-cwd', []);
      });

      expect(Deno.exitCode).to.eql(9);
    });
  });

  it('delegates -h passthrough to jsr:@sys/tmpl outside monorepo', async () => {
    type InheritArgs = Parameters<typeof Process.inherit>[0];
    const calls: InheritArgs[] = [];
    await Fixture.withNearestStub(async () => Fixture.makeNearest(false), async () => {
      await Fixture.withWorkspaceStub(async () => Fixture.makeWorkspace(false), async () => {
        await Fixture.withInheritStub(async (config) => {
          calls.push(config);
          return { code: 0, success: true, signal: null };
        }, async () => {
          await cli('/tmp/tool-cwd', ['-h']);
        });
      });
    });

    expect(calls.length).to.eql(1);
    expect(calls[0]?.args).to.eql(['run', '-A', 'jsr:@sys/tmpl', '-h']);
  });

  it('falls back to jsr:@sys/tmpl when workspace root is not /sys', async () => {
    type InheritArgs = Parameters<typeof Process.inherit>[0];
    const calls: InheritArgs[] = [];

    await Fixture.withNearestStub(async () => Fixture.makeNearest(true), async () => {
      await Fixture.withWorkspaceStub(async () => Fixture.makeWorkspace(false), async () => {
        await Fixture.withInheritStub(async (config) => {
          calls.push(config);
          return { code: 0, success: true, signal: null };
        }, async () => {
          await cli('/tmp/tool-cwd', ['-h']);
        });
      });
    });

    expect(calls.length).to.eql(1);
    expect(calls[0]?.args).to.eql(['run', '-A', 'jsr:@sys/tmpl', '-h']);
  });
});

async function withExitCode(value: number, run: () => Promise<void>) {
  const previous = Deno.exitCode;
  try {
    Deno.exitCode = value;
    await run();
  } finally {
    Deno.exitCode = previous;
  }
}
