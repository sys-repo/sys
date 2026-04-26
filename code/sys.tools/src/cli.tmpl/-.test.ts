import { describe, expect, Fs, it } from '../-test.ts';
import { Process, DenoFile, type t } from '../common.ts';
import { TmplTool } from './t.ts';
import * as TmplTools from './mod.ts';

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

    await Fixture.withNearestStub(async () => undefined, async () => {
      await Fixture.withWorkspaceStub(async () => Fixture.workspace(false), async () => {
        await Fixture.withInheritStub(async (config) => {
          calls.push(config);
          return { code: 0, success: true, signal: null };
        }, async () => {
          await TmplTools.cli('/tmp/tool-cwd', ['pkg.deno', '--dir', 'code/ns/foo', '--non-interactive']);
        });
      });
    });

    expect(calls.length).to.eql(1);
    expect(calls[0]?.cwd).to.eql('/tmp/tool-cwd');
    expect(calls[0]?.args?.[0]).to.eql('run');
    expect(calls[0]?.args?.[1]).to.eql('-A');
    expect(calls[0]?.args?.[2]).to.match(/^jsr:@sys\/tmpl@/);
    expect(calls[0]?.args?.slice(3)).to.eql(['pkg.deno', '--dir', 'code/ns/foo', '--non-interactive']);
  });

  it('inside @sys monorepo delegates to @sys/tmpl (no jsr prefix)', async () => {
    type InheritArgs = Parameters<typeof Process.inherit>[0];
    const calls: InheritArgs[] = [];

    await Fixture.withNearestStub(async () => Fixture.nearest(), async () => {
      await Fixture.withWorkspaceStub(async () => Fixture.workspace(true), async () => {
        await Fixture.withInheritStub(async (config) => {
          calls.push(config);
          return { code: 0, success: true, signal: null };
        }, async () => {
          await TmplTools.cli('/tmp/tool-cwd', ['-h']);
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
        await TmplTools.cli('/tmp/tool-cwd', []);
      });

      expect(Deno.exitCode).to.eql(9);
    });
  });

  it('falls back to jsr:@sys/tmpl when workspace root is not /sys', async () => {
    type InheritArgs = Parameters<typeof Process.inherit>[0];
    const calls: InheritArgs[] = [];

    await Fixture.withNearestStub(async () => Fixture.nearest(), async () => {
      await Fixture.withWorkspaceStub(async () => Fixture.workspace(false), async () => {
        await Fixture.withInheritStub(async (config) => {
          calls.push(config);
          return { code: 0, success: true, signal: null };
        }, async () => {
          await TmplTools.cli('/tmp/tool-cwd', ['-h']);
        });
      });
    });

    expect(calls.length).to.eql(1);
    expect(calls[0]?.args?.[0]).to.eql('run');
    expect(calls[0]?.args?.[1]).to.eql('-A');
    expect(calls[0]?.args?.[2]).to.match(/^jsr:@sys\/tmpl@/);
    expect(calls[0]?.args?.slice(3)).to.eql(['-h']);
  });
});

const mutableProcess = Process as t.Mutable<typeof Process>;
const mutableDenoFile = DenoFile as t.Mutable<typeof DenoFile>;

const Fixture = {
  async withInheritStub(stub: typeof Process.inherit, run: () => Promise<void>) {
    const original = Process.inherit;
    try {
      mutableProcess.inherit = stub;
      await run();
    } finally {
      mutableProcess.inherit = original;
    }
  },

  async withWorkspaceStub(stub: (...args: unknown[]) => Promise<unknown>, run: () => Promise<void>) {
    const original = DenoFile.workspace;
    try {
      mutableDenoFile.workspace = stub as typeof DenoFile.workspace;
      await run();
    } finally {
      mutableDenoFile.workspace = original;
    }
  },

  async withNearestStub(stub: (...args: unknown[]) => Promise<unknown>, run: () => Promise<void>) {
    const original = DenoFile.nearest;
    try {
      mutableDenoFile.nearest = stub as typeof DenoFile.nearest;
      await run();
    } finally {
      mutableDenoFile.nearest = original;
    }
  },

  nearest() {
    return {
      path: '/repo/sys/deno.json',
      dir: '/repo/sys',
      file: { workspace: [] as string[] },
      is: { workspace: true as const },
    };
  },

  workspace(inSysMonorepo: boolean) {
    const children = inSysMonorepo
      ? [
        { pkg: { name: '@sys/tools', version: '0.0.0' }, dir: 'code/sys.tools' },
        { pkg: { name: '@sys/tmpl', version: '0.0.0' }, dir: 'code/-tmpl' },
      ]
      : [{ pkg: { name: '@sample/other', version: '0.0.0' }, dir: 'code/pkg' }];

    return Promise.resolve({
      exists: true,
      dir: inSysMonorepo ? '/repo/sys' : '/repo/not-sys',
      file: inSysMonorepo ? '/repo/sys/deno.json' : '/repo/not-sys/deno.json',
      children: children.map((item) => ({
        path: { dir: item.dir, denofile: `./${item.dir}/deno.json` },
        pkg: item.pkg,
        denofile: { name: item.pkg.name, version: item.pkg.version },
      })),
      get modules() {
        return {
          ok: true,
          items: [],
          count: 0,
          error: undefined,
          latest() {
            return '0.0.0';
          },
        };
      },
    } as const);
  },
} as const;

async function withExitCode(value: number, run: () => Promise<void>) {
  const previous = Deno.exitCode;
  try {
    Deno.exitCode = value;
    await run();
  } finally {
    Deno.exitCode = previous;
  }
}
