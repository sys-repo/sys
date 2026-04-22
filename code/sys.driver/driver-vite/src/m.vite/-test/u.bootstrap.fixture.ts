import { Fs } from '../../-test.ts';
import { resolveFromImportMap } from '../../-test/u.importMap.ts';
import { Wrangle } from '../u.wrangle.ts';

export async function authorityConflictFixture(prefix: string) {
  const tmp = await Fs.makeTempDir({ prefix });
  const root = tmp.absolute;
  const child = `${root}/code/projects/foo`;
  await Fs.ensureDir(child);

  await Fs.writeJson(`${root}/package.json`, {
    dependencies: {
      vite: '8.0.9',
      esbuild: '0.27.4',
    },
  });
  await Fs.writeJson(`${root}/imports.json`, {
    imports: {
      '@root/only': './root-only.ts',
      '@shared/conflict': './root-conflict.ts',
    },
    scopes: {
      './root/': {
        '@scope/root': './scope-root.ts',
      },
    },
    xRootOnly: {
      from: 'root',
    },
  });
  await Fs.writeJson(`${root}/deno.json`, {
    workspace: ['./code/projects/foo'],
    imports: {
      '@inline/root': './inline-root.ts',
    },
    importMap: './imports.json',
  });

  await Fs.writeJson(`${child}/imports.json`, {
    imports: {
      '@child/only': './child-only.ts',
      '@shared/conflict': './child-conflict.ts',
    },
    scopes: {
      './child/': {
        '@scope/child': './scope-child.ts',
      },
    },
    xChildOnly: {
      from: 'child',
    },
  });
  await Fs.writeJson(`${child}/deno.json`, {
    imports: {
      '@inline/child': './inline-child.ts',
    },
    importMap: './imports.json',
  });

  return {
    root,
    child,
    paths: {
      cwd: child,
      app: {
        entry: 'index.html',
        outDir: 'dist',
        base: '.',
      },
    } as const,
  };
}

export async function bootstrapImportMap(
  paths: {
    readonly cwd: string;
    readonly app: { readonly entry: string; readonly outDir: string; readonly base: string };
  },
  arg = 'build',
) {
  const res = await Wrangle.command(paths, arg);
  const importMapArg = res.args.find((item) => item.startsWith('--import-map='));
  const path = importMapArg?.replace('--import-map=', '') ?? '';
  const loaded = path
    ? await Fs.readJson<Record<string, unknown>>(path)
    : { data: undefined };

  return {
    path,
    data: loaded.data ?? {},
    resolve(value?: string) {
      return resolveFromImportMap(path, value);
    },
    dispose: res.dispose,
  } as const;
}
