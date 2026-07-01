import { Is, Json, Obj, Process, Semver, type t } from './common.ts';
import { GraphCli } from '../m.graph/u.cli/mod.ts';
import { validateInfoJson } from '../m.graph/u.schema/mod.ts';

type Invoke = typeof Process.invoke;
type ResolvePackageDeps = { readonly invoke?: Invoke };
type ParsedSpecifier = {
  readonly registry: t.EsmRegistry;
  readonly package: t.StringPkgName;
  readonly constraint: string;
};
type ResolvedLookup =
  | { readonly ok: true; readonly version: t.StringSemver }
  | { readonly ok: false; readonly reason?: string };

/** Resolve a package specifier using Deno's active resolver policy. */
export async function resolvePackage(
  args: t.WorkspaceResolve.PackageResolutionRequest,
  deps: ResolvePackageDeps = {},
): Promise<t.WorkspaceResolve.PackageResolutionFact> {
  const parsed = parsePackageSpecifier(args.specifier);
  if (!parsed) {
    return failed(args.specifier, undefined, {
      code: 'unknown',
      message: `Unsupported package specifier: ${args.specifier}`,
    });
  }

  const command = GraphCli.info({ cwd: args.cwd, root: args.specifier, reload: args.reload });
  const output = await (deps.invoke ?? Process.invoke)({
    ...command,
    args: [...command.args],
    silent: true,
  });

  if (!output.success) {
    return failed(args.specifier, parsed, classifyPackageResolutionFailure(output.text));
  }

  try {
    const info = validateInfoJson(Json.parse(output.text.stdout));
    return packageResolutionFromInfo(args.specifier, info);
  } catch (error) {
    return failed(args.specifier, parsed, {
      code: 'unknown',
      message: error instanceof Error ? error.message : 'Could not parse deno info output',
    });
  }
}

/** Normalize the package resolution fact from `deno info --json` output. */
export function packageResolutionFromInfo(
  specifier: t.StringModuleSpecifier,
  info: { readonly redirects?: Record<string, string>; readonly packages?: Record<string, string> },
): t.WorkspaceResolve.PackageResolutionFact {
  const parsed = parsePackageSpecifier(specifier);
  if (!parsed) {
    return failed(specifier, undefined, {
      code: 'unknown',
      message: `Unsupported package specifier: ${specifier}`,
    });
  }

  const resolved = findResolvedVersion(specifier, info, parsed);
  if (resolved.ok) {
    const { registry } = parsed;
    return { ok: true, specifier, registry, package: parsed.package, resolved: resolved.version };
  }

  return failed(specifier, parsed, {
    code: 'unknown',
    message: resolved.reason ?? `Deno info did not report a resolved version for ${parsed.package}`,
  });
}

/** Classify a Deno resolver failure without inventing certainty. */
export function classifyPackageResolutionFailure(
  text: { readonly stdout?: string; readonly stderr?: string } | string,
): t.WorkspaceResolve.PackageResolutionReason {
  const message = Is.str(text) ? text : [text.stderr, text.stdout].filter(Is.str).join('\n').trim();
  const normalized = message.toLowerCase();

  if (
    normalized.includes('minimum dependency age') ||
    normalized.includes('minimum dependency date') ||
    normalized.includes('minimum-dependency-age')
  ) {
    return { code: 'policy:minimum-dependency-age', message };
  }

  if (normalized.includes('lockfile') || normalized.includes('lock file')) {
    return { code: 'config-or-lock', message };
  }

  if (
    normalized.includes('registry') ||
    normalized.includes('jsr package') ||
    normalized.includes('npm package')
  ) {
    return { code: 'registry', message };
  }

  return { code: 'unknown', message: message || 'Deno package resolution failed' };
}

function failed(
  specifier: t.StringModuleSpecifier,
  parsed: ParsedSpecifier | undefined,
  reason: t.WorkspaceResolve.PackageResolutionReason,
): t.WorkspaceResolve.PackageResolutionFailed {
  if (!parsed) return { ok: false, specifier, reason };
  return { ok: false, specifier, registry: parsed.registry, package: parsed.package, reason };
}

function parsePackageSpecifier(input: string): ParsedSpecifier | undefined {
  if (input.startsWith('jsr:')) return parseBody('jsr', input.slice('jsr:'.length));
  if (input.startsWith('npm:')) return parseBody('npm', input.slice('npm:'.length));
  return undefined;
}

function parseBody(registry: t.EsmRegistry, body: string): ParsedSpecifier | undefined {
  const parts = body.split('/');
  const first = parts[0] ?? '';
  if (!first) return undefined;

  if (first.startsWith('@')) {
    const second = parts[1] ?? '';
    if (!second) return undefined;
    const parsed = parseNameSegment(second);
    if (!parsed.name) return undefined;
    return {
      registry,
      package: `${first}/${parsed.name}` as t.StringPkgName,
      constraint: parsed.constraint,
    };
  }

  const parsed = parseNameSegment(first);
  if (!parsed.name) return undefined;
  return { registry, package: parsed.name as t.StringPkgName, constraint: parsed.constraint };
}

function parseNameSegment(input: string) {
  const index = input.lastIndexOf('@');
  if (index <= 0) return { name: input, constraint: '*' };
  return {
    name: input.slice(0, index),
    constraint: input.slice(index + 1) || '*',
  };
}

function findResolvedVersion(
  specifier: t.StringModuleSpecifier,
  info: { readonly redirects?: Record<string, string>; readonly packages?: Record<string, string> },
  parsed: ParsedSpecifier,
): ResolvedLookup {
  const packages = info.packages ?? {};
  const exact = packages[packageRef(parsed.package, parsed.constraint)];
  const exactVersion = exact ? versionFromPackageRef(exact, parsed.package) : undefined;
  if (exactVersion) return { ok: true, version: exactVersion };

  if (parsed.registry === 'jsr') {
    const exactRedirect = info.redirects?.[specifier];
    const redirectVersion = exactRedirect
      ? versionFromJsrUrl(exactRedirect, parsed.package)
      : undefined;
    if (redirectVersion) return { ok: true, version: redirectVersion };
  }

  const wildcard = packages[packageRef(parsed.package, '*')];
  const wildcardVersion = wildcard ? versionFromPackageRef(wildcard, parsed.package) : undefined;
  if (wildcardVersion) return { ok: true, version: wildcardVersion };

  const packageVersions = uniquePackageVersions(packages, parsed.package);
  if (packageVersions.length === 1) return { ok: true, version: packageVersions[0] };
  if (packageVersions.length > 1) {
    return {
      ok: false,
      reason:
        `Deno info reported multiple resolved versions for ${parsed.package} without an exact root package fact`,
    };
  }

  if (parsed.registry === 'jsr') {
    const redirectVersions = uniqueJsrRedirectVersions(info.redirects ?? {}, parsed.package);
    if (redirectVersions.length === 1) return { ok: true, version: redirectVersions[0] };
    if (redirectVersions.length > 1) {
      return {
        ok: false,
        reason:
          `Deno info reported multiple redirected versions for ${parsed.package} without an exact root redirect`,
      };
    }
  }

  return { ok: false };
}

function packageRef(packageName: t.StringPkgName, constraint: string) {
  return `${packageName}@${constraint}`;
}

function uniquePackageVersions(
  packages: Record<string, string>,
  packageName: t.StringPkgName,
): t.StringSemver[] {
  const versions: t.StringSemver[] = [];
  for (const [, value] of Obj.entries(packages)) {
    const version = versionFromPackageRef(value, packageName);
    if (version) appendUnique(versions, version);
  }
  for (const [key] of Obj.entries(packages)) {
    const version = versionFromPackageRef(key, packageName);
    if (version) appendUnique(versions, version);
  }
  return versions;
}

function uniqueJsrRedirectVersions(
  redirects: Record<string, string>,
  packageName: t.StringPkgName,
): t.StringSemver[] {
  const versions: t.StringSemver[] = [];
  for (const [, value] of Obj.entries(redirects)) {
    const version = versionFromJsrUrl(value, packageName);
    if (version) appendUnique(versions, version);
  }
  return versions;
}

function appendUnique<T>(list: T[], item: T) {
  if (!list.includes(item)) list.push(item);
}

function versionFromPackageRef(value: string, packageName: t.StringPkgName) {
  const prefix = `${packageName}@`;
  if (!value.startsWith(prefix)) return undefined;
  const version = value.slice(prefix.length).split('/')[0];
  return Semver.Is.valid(version) ? (version as t.StringSemver) : undefined;
}

function versionFromJsrUrl(value: string, packageName: t.StringPkgName) {
  try {
    const url = new URL(value);
    if (url.hostname !== 'jsr.io') return undefined;

    const pkgParts = packageName.split('/');
    const pathParts = url.pathname.split('/').filter(Boolean);
    if (pathParts[0] !== pkgParts[0] || pathParts[1] !== pkgParts[1]) return undefined;

    const version = pathParts[2];
    return Semver.Is.valid(version) ? (version as t.StringSemver) : undefined;
  } catch {
    return undefined;
  }
}
