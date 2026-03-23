import { Err, Fs, Jsr, Npm, Str, type t } from '../../-test.ts';


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

export async function withVersions(
  map: {
    jsr: Record<string, VersionsResponse>;
    npm: Record<string, VersionsResponse>;
  },
  fn: () => Promise<void>,
) {
  const originalJsr = Jsr.Fetch.Pkg.versions;
  const originalNpm = Npm.Fetch.Pkg.versions;
  const mutableJsr = Jsr.Fetch.Pkg as t.Mutable<t.JsrFetchPkgLib>;
  const mutableNpm = Npm.Fetch.Pkg as t.Mutable<t.NpmFetchPkgLib>;

  mutableJsr.versions = async (name) => map.jsr[name] as never;
  mutableNpm.versions = async (name) => map.npm[name] as never;
  try {
    await fn();
  } finally {
    mutableJsr.versions = originalJsr;
    mutableNpm.versions = originalNpm;
  }
}
