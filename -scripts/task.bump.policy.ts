import { Json } from '@sys/std/json';
import { type t } from '@sys/workspace';
import { toPassthroughCouplings } from './u.passthrough.ts';

const PATHS = {
  rootDenoJson: new URL('../deno.json', import.meta.url),
  tmplRepoImports: new URL('../code/-tmpl/-templates/tmpl.repo/imports.json', import.meta.url),
  driverVitePublishedFixtureImports: [
    new URL(
      '../code/sys.driver/driver-vite/src/-test/vite.sample-published-baseline/imports.json',
      import.meta.url,
    ),
    new URL(
      '../code/sys.driver/driver-vite/src/-test/vite.sample-published-ui-baseline/imports.json',
      import.meta.url,
    ),
    new URL(
      '../code/sys.driver/driver-vite/src/-test/vite.sample-published-ui-components/imports.json',
      import.meta.url,
    ),
  ],
} as const;

export function postBumpPrepArgs() {
  return [
    'run',
    '-P=dev',
    './-scripts/main.ts',
    '--prep-bump',
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
      ...wrangle.driverVitePublishedFixtureCouplings(),
    ];
  },

  tmplRepoCouplings(): readonly t.WorkspaceBump.PackageEdge[] {
    return wrangle.importMapCouplings(PATHS.tmplRepoImports, 'code/-tmpl');
  },

  driverVitePublishedFixtureCouplings(): readonly t.WorkspaceBump.PackageEdge[] {
    const consumerPath = 'code/sys.driver/driver-vite';
    const seen = new Set<string>();
    const couplings: t.WorkspaceBump.PackageEdge[] = [];

    for (const path of PATHS.driverVitePublishedFixtureImports) {
      for (const edge of wrangle.importMapCouplings(path, consumerPath)) {
        const key = `${edge.from}->${edge.to}`;
        if (seen.has(key)) continue;
        seen.add(key);
        couplings.push(edge);
      }
    }

    return couplings;
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

  importMapCouplings(path: URL, consumerPath: string): readonly t.WorkspaceBump.PackageEdge[] {
    const pkgByName = wrangle.workspacePackagePaths();
    const imports = wrangle.readJson<{ imports?: Record<string, string> }>(path).imports ?? {};
    const seen = new Set<string>();

    return Object.values(imports).flatMap((value) => {
      const pkg = wrangle.jsrPackageName(value);
      if (!pkg) return [];
      const from = pkgByName.get(pkg);
      if (!from || from === consumerPath || seen.has(from)) return [];
      seen.add(from);
      return [{ from, to: consumerPath }];
    });
  },
} as const;
