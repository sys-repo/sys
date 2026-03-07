import { DenoFile, Process, type t } from '../common.ts';

type Inherit = typeof Process.inherit;
type WorkspaceStub = (src?: t.StringPath, options?: { walkup?: boolean }) => Promise<unknown>;
type NearestStub = typeof DenoFile.nearest;

const mutableProcess = Process as t.Mutable<typeof Process>;
const mutableDenoFile = DenoFile as t.Mutable<typeof DenoFile>;

export const Fixture = {
  async withInheritStub(stub: Inherit, run: () => Promise<void>) {
    const original = Process.inherit;
    try {
      mutableProcess.inherit = stub;
      await run();
    } finally {
      mutableProcess.inherit = original;
    }
  },

  async withWorkspaceStub(stub: WorkspaceStub, run: () => Promise<void>) {
    const original = DenoFile.workspace;
    try {
      mutableDenoFile.workspace = stub as typeof DenoFile.workspace;
      await run();
    } finally {
      mutableDenoFile.workspace = original;
    }
  },

  async withNearestStub(stub: NearestStub, run: () => Promise<void>) {
    const original = DenoFile.nearest;
    try {
      mutableDenoFile.nearest = stub;
      await run();
    } finally {
      mutableDenoFile.nearest = original;
    }
  },

  makeNearest(isWorkspace: boolean) {
    if (!isWorkspace) return undefined;
    return {
      path: '/repo/sys/deno.json',
      dir: '/repo/sys',
      file: { workspace: [] as string[] },
      is: { workspace: true as const },
    };
  },

  makeWorkspace(inSysMonorepo: boolean) {
    const sysChildren = inSysMonorepo
      ? [
          { pkg: { name: '@sys/tools', version: '0.0.0' }, dir: 'code/sys.tools' },
          { pkg: { name: '@sys/tmpl', version: '0.0.0' }, dir: 'code/-tmpl' },
        ]
      : [{ pkg: { name: '@sample/other', version: '0.0.0' }, dir: 'code/pkg' }];

    return {
      exists: true,
      dir: inSysMonorepo ? '/repo/sys' : '/repo/not-sys',
      file: inSysMonorepo ? '/repo/sys/deno.json' : '/repo/not-sys/deno.json',
      children: sysChildren.map(
        (item) =>
          ({
            path: { dir: item.dir, denofile: `./${item.dir}/deno.json` },
            pkg: item.pkg,
            denofile: { name: item.pkg.name, version: item.pkg.version },
          }) as const,
      ),
      get modules() {
        return {
          ok: true,
          items: [],
          count: 0,
          error: undefined,
          latest(input?: unknown) {
            return typeof input === 'string' ? '0.0.0' : {};
          },
        };
      },
    };
  },
} as const;
