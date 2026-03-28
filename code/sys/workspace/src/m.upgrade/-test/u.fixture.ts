import { Err, Fs, Is, Jsr, Npm, Str, type t } from '../../-test.ts';

export type VersionsResponse =
  | t.Registry.Jsr.Fetch.PkgVersionsResponse
  | t.Registry.Npm.Fetch.PkgVersionsResponse;
export type InfoResponse =
  | t.Registry.Jsr.Fetch.PkgInfoResponse
  | t.Registry.Npm.Fetch.PkgInfoResponse;

type TestDir = { join(path: string): string };

export function depsYaml(text: string) {
  return `${Str.dedent(text).trim()}\n`;
}

export async function writeDepsYaml(fs: TestDir, text: string) {
  await Fs.write(fs.join('deps.yaml'), depsYaml(text));
}

export function versionsJsr(
  pkgName: string,
  latest: string,
  published: Record<string, { yanked?: boolean }> = {},
): VersionsResponse {
  const [scope, name] = pkgName.slice(1).split('/');
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    url: 'https://jsr.io',
    headers: new Headers(),
    error: undefined,
    data: { latest, versions: published, scope, name },
  };
}

export function versionsNpm(
  name: string,
  latest: string,
  published: Record<string, { deprecated?: string }> = {},
): VersionsResponse {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    url: 'https://registry.npmjs.org',
    headers: new Headers(),
    error: undefined,
    data: { latest, versions: published, name },
  };
}

export function fetchFail(url: string): VersionsResponse {
  return {
    ok: false,
    status: 500,
    statusText: 'Server Error',
    url,
    headers: new Headers(),
    data: undefined,
    error: {
      ...Err.std('Registry fetch failed', { name: 'HttpError' }),
      status: 500,
      statusText: 'Server Error',
      headers: {},
    },
  };
}

export function infoNpm(
  name: string,
  version: string,
  dependencies: Record<string, string> = {},
): t.Registry.Npm.Fetch.PkgInfoResponse {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    url: `https://registry.npmjs.org/${name}/${version}`,
    headers: new Headers(),
    error: undefined,
    data: {
      pkg: { name, version },
      dependencies,
      devDependencies: undefined,
      dist: undefined,
      exports: undefined,
    },
  };
}

export function infoJsr(
  name: string,
  version: string,
  graph?: t.Registry.Jsr.Fetch.PkgGraph,
): t.Registry.Jsr.Fetch.PkgInfoResponse {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    url: `https://jsr.io/${name}/${version}_meta.json`,
    headers: new Headers(),
    error: undefined,
    data: {
      pkg: { name, version },
      manifest: undefined,
      exports: undefined,
      graph,
    },
  };
}

export function graphJsr(
  format: 1 | 2,
  modules: readonly {
    path: string;
    dependencies?: readonly ({ specifier: string; kind?: string } | string)[];
  }[],
): t.Registry.Jsr.Fetch.PkgGraph {
  return {
    format,
    modules: modules.map((module) => ({
      path: module.path,
      dependencies: (module.dependencies ?? []).map((dep) =>
        Is.str(dep) ? { specifier: dep } : dep
      ),
    })),
  };
}

export async function withVersions(
  map: {
    jsr: Record<string, VersionsResponse>;
    npm: Record<string, VersionsResponse>;
  },
  fn: () => Promise<void>,
) {
  const originalJsr = Jsr.Fetch.Pkg.versions;
  const originalNpm = Npm.Fetch.Pkg.versions;
  const mutableJsr = Jsr.Fetch.Pkg as t.Mutable<t.Registry.Jsr.Fetch.PkgLib>;
  const mutableNpm = Npm.Fetch.Pkg as t.Mutable<t.Registry.Npm.Fetch.PkgLib>;

  mutableJsr.versions = async (name) => map.jsr[name] as never;
  mutableNpm.versions = async (name) => map.npm[name] as never;
  try {
    await fn();
  } finally {
    mutableJsr.versions = originalJsr;
    mutableNpm.versions = originalNpm;
  }
}

export async function withInfo(
  map: {
    jsr: Record<string, InfoResponse>;
    npm: Record<string, InfoResponse>;
  },
  fn: () => Promise<void>,
) {
  const originalJsr = Jsr.Fetch.Pkg.info;
  const originalNpm = Npm.Fetch.Pkg.info;
  const mutableJsr = Jsr.Fetch.Pkg as t.Mutable<t.Registry.Jsr.Fetch.PkgLib>;
  const mutableNpm = Npm.Fetch.Pkg as t.Mutable<t.Registry.Npm.Fetch.PkgLib>;

  mutableJsr.info = async (name, version) => map.jsr[`${name}@${version ?? ''}`] as never;
  mutableNpm.info = async (name, version) => map.npm[`${name}@${version ?? ''}`] as never;
  try {
    await fn();
  } finally {
    mutableJsr.info = originalJsr;
    mutableNpm.info = originalNpm;
  }
}
