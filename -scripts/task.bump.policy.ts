import { Json } from '@sys/std/json';
import { type t } from '@sys/workspace';
import { toPassthroughCouplings } from './u.passthrough.ts';

const PATHS = {
  rootDenoJson: new URL('../deno.json', import.meta.url),
  tmplRepoImports: new URL('../code/-tmpl/-templates/tmpl.repo/imports.json', import.meta.url),
} as const;

export function postBumpPrepArgs() {
  return [
    'run',
    '-P=dev',
    './-scripts/main.ts',
    '--prep-all',
    '--ahead-only',
    '--prep-context=bump',
  ] as const;
}

export function postBumpPackageSyncArgs() {
  return ['run', '-P=dev', './-scripts/main.ts', '--prep-pkg'] as const;
}

export function bumpPolicy(): t.WorkspaceBump.Policy {
  return {
    couplings: wrangle.couplings(),
    exclude: (path) => path.includes('deploy/@tdb.slc/'),
    followups({ cwd }) {
      return [
        {
          cwd,
          cmd: 'deno',
          label: 'post-bump package metadata sync',
          args: [...postBumpPackageSyncArgs()],
        },
        { label: 'post-bump prep', cmd: 'deno', args: [...postBumpPrepArgs()], cwd },
      ];
    },
  };
}

const wrangle = {
  couplings() {
    return [
      ...toPassthroughCouplings(),
      ...wrangle.tmplRepoCouplings(),
    ];
  },

  tmplRepoCouplings(): readonly t.WorkspaceBump.PackageEdge[] {
    const pkgByName = wrangle.workspacePackagePaths();
    const imports =
      wrangle.readJson<{ imports?: Record<string, string> }>(PATHS.tmplRepoImports).imports ?? {};
    const tmplPath = 'code/-tmpl';
    const seen = new Set<string>();

    return Object.values(imports).flatMap((value) => {
      const pkg = wrangle.jsrPackageName(value);
      if (!pkg) return [];
      const from = pkgByName.get(pkg);
      if (!from || from === tmplPath || seen.has(from)) return [];
      seen.add(from);
      return [{ from, to: tmplPath }];
    });
  },

  workspacePackagePaths() {
    const root = wrangle.readJson<{ workspace?: unknown }>(PATHS.rootDenoJson);
    const workspace = Array.isArray(root.workspace)
      ? root.workspace.filter((value): value is string => typeof value === 'string')
      : [];
    const map = new Map<string, string>();

    for (const pkgPath of workspace) {
      const deno = wrangle.readJson<{ name?: unknown }>(
        new URL(`../${pkgPath}/deno.json`, import.meta.url),
      );
      if (typeof deno.name !== 'string' || deno.name.length === 0) continue;
      map.set(deno.name, pkgPath);
    }

    return map;
  },

  readJson<T>(path: URL): T {
    return Json.parse(Deno.readTextFileSync(path)) as T;
  },

  jsrPackageName(specifier: string) {
    const match = specifier.match(/^jsr:(@[^@/]+\/[^@/]+)@/);
    return match?.[1];
  },
} as const;
