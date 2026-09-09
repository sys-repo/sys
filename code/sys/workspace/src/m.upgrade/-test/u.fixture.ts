import { Err, Fs, Is, Jsr, Npm, Obj, Str, type t, Time } from '../../-test.ts';
import { applyWithSession } from '../u.apply.ts';
import { collectWithSession } from '../u.collect.ts';
import {
  createSession,
  type UpgradeRegistryDependencies,
  type UpgradeSession,
} from '../u.session.ts';
import { upgradeWithSession } from '../u.upgrade.ts';

type RegistryVersions = {
  readonly jsr: Readonly<Record<string, t.Registry.Jsr.Fetch.Pkg.VersionsResponse>>;
  readonly npm: Readonly<Record<string, t.Registry.Npm.Fetch.Pkg.VersionsResponse>>;
};

type RegistryInfo = {
  readonly jsr: Readonly<Record<string, t.Registry.Jsr.Fetch.Pkg.InfoResponse>>;
  readonly npm: Readonly<Record<string, t.Registry.Npm.Fetch.Pkg.InfoResponse>>;
};

type RegistryFixture = {
  readonly versions: RegistryVersions;
  readonly info?: RegistryInfo;
};

type TestDir = { join(path: string): string };

export const standdownTime = {
  day: 24 * 60 * 60 * 1000,
  now: Time.utc('2026-06-28T00:00:00.000Z').timestamp,
  older: '2026-06-25T00:00:00.000Z' as t.StringTimestamp,
  tooNew: '2026-06-27T12:00:00.000Z' as t.StringTimestamp,
  current: '2026-06-27T23:00:00.000Z' as t.StringTimestamp,
  eligibleAt: Time.utc('2026-06-29T12:00:00.000Z').timestamp,
} as const;

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
): t.Registry.Jsr.Fetch.Pkg.VersionsResponse {
  const [scope, name] = pkgName.slice(1).split('/');
  const url = Jsr.Url.Pkg.metadata(pkgName);
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    requestedUrl: url,
    finalUrl: url,
    headers: new Headers(),
    error: undefined,
    data: { latest, versions: published, scope, name },
  };
}

export function versionsNpm(
  name: string,
  latest: string,
  published: Record<string, { deprecated?: string; publishedAt?: t.StringTimestamp }> = {},
): t.Registry.Npm.Fetch.Pkg.VersionsResponse {
  const url = Npm.Url.Pkg.metadata(name);
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    requestedUrl: url,
    finalUrl: url,
    headers: new Headers(),
    error: undefined,
    data: { latest, versions: published, name },
  };
}

export function fetchFail(url: string): t.Registry.Npm.Fetch.Pkg.VersionsResponse {
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
): t.Registry.Npm.Fetch.Pkg.InfoResponse {
  const url = Npm.Url.Pkg.version(name, version);
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    requestedUrl: url,
    finalUrl: url,
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
  graph?: t.Registry.Jsr.Fetch.Pkg.Graph,
): t.Registry.Jsr.Fetch.Pkg.InfoResponse {
  const url = Jsr.Url.Pkg.version(name, version);
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    requestedUrl: url,
    finalUrl: url,
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
): t.Registry.Jsr.Fetch.Pkg.Graph {
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

export function registry(fixture: RegistryFixture): UpgradeRegistryDependencies {
  const info = fixture.info ?? { jsr: {}, npm: {} };
  return {
    jsr: {
      versions: (name) => Promise.resolve(required(fixture.versions.jsr, name, 'JSR versions')),
      info: (name, version) => {
        const key = `${name}@${version ?? ''}`;
        return Promise.resolve(required(info.jsr, key, 'JSR info'));
      },
    },
    npm: {
      versions: (name) => Promise.resolve(required(fixture.versions.npm, name, 'NPM versions')),
      info: (name, version) => {
        const key = `${name}@${version ?? ''}`;
        return Promise.resolve(required(info.npm, key, 'NPM info'));
      },
    },
  };
}

function required<T>(map: Readonly<Record<string, T>>, key: string, kind: string): T {
  if (Obj.hasOwn(map, key)) return map[key];
  throw Err.std(`Unexpected ${kind} registry lookup: ${key}`);
}

export function session(registry: UpgradeRegistryDependencies): UpgradeSession {
  return createSession(registry);
}

export function collect(
  registry: UpgradeRegistryDependencies,
  input: t.WorkspaceUpgrade.Input,
  options?: t.WorkspaceUpgrade.Options,
) {
  return collectWithSession(input, options, session(registry));
}

export function upgrade(
  registry: UpgradeRegistryDependencies,
  input: t.WorkspaceUpgrade.Input,
  options?: t.WorkspaceUpgrade.Options,
) {
  return upgradeWithSession(input, options, session(registry));
}

export function apply(
  registry: UpgradeRegistryDependencies,
  input: t.WorkspaceUpgrade.Input,
  options?: t.WorkspaceUpgrade.Options,
) {
  return applyWithSession(input, options, session(registry));
}
