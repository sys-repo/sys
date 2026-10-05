import { DenoDeps } from '@sys/driver-deno/runtime';
import { Fs, Is, Semver } from './common.ts';
import { PI_AGENT_IMPORT_BASE } from '../src/m.cli/u/u.resolve.pkg.ts';

export type PrepPaths = {
  rootDepsYaml: string;
  resolvePkgFile: string;
};

export type DenoDepsLib = {
  from(input: string): Promise<{ error?: unknown; data?: { deps?: unknown } }>;
  findImport(deps: unknown, input: string): string | undefined;
};

const PI_AGENT_IMPORT_BASE_LINE =
  `export const PI_AGENT_IMPORT_BASE = '${PI_AGENT_IMPORT_BASE}' as const;`;
const PI_AGENT_IMPORT_EXPRESSION =
  'export const PI_AGENT_IMPORT = `${PI_AGENT_IMPORT_BASE}@${PI_AGENT_IMPORT_VERSION}` as const;';
const PI_AGENT_IMPORT_VERSION_PATTERN = /^const PI_AGENT_IMPORT_VERSION = '[^']+' as const;$/gm;

export const PATH = {
  fromRoot(root: string): PrepPaths {
    return {
      rootDepsYaml: Fs.join(root, 'deps.yaml'),
      resolvePkgFile: Fs.join(root, 'code/sys.driver/driver-pi/src/m.cli/u/u.resolve.pkg.ts'),
    };
  },
} as const;

/**
 * Keep the release fallback derived from dependency authority.
 * Check mode rejects drift without writing; apply writes only on change.
 * Failures reject without rollback or atomic-replacement guarantees.
 */
export async function syncPiAgentImport(path: PrepPaths, options: { check?: boolean } = {}) {
  const specifier = await resolvePiAgentImport(path.rootDepsYaml, DenoDeps);
  const source = await Fs.readText(path.resolvePkgFile);
  if (!source.ok || !Is.string(source.data)) {
    throw new Error(`Failed to read Pi dependency metadata: ${path.resolvePkgFile}`, {
      cause: source.error,
    });
  }
  const next = pinPiAgentImport(source.data, specifier);
  const changed = next !== source.data;
  if (changed && options.check) {
    throw new Error(
      `Stale Pi dependency metadata: ${path.resolvePkgFile}. ` +
        'Run deno task prep:deps in code/sys.driver/driver-pi.',
    );
  }
  if (changed) await Fs.write(path.resolvePkgFile, next, { throw: true });
  return { changed, specifier, path: path.resolvePkgFile } as const;
}

export async function resolvePiAgentImport(
  source: string,
  denoDeps: DenoDepsLib,
): Promise<string> {
  const res = await denoDeps.from(source);
  if (res.error) throw res.error;

  const value = denoDeps.findImport(res.data?.deps, PI_AGENT_IMPORT_BASE);
  if (!Is.string(value)) {
    throw new Error(`Missing deps import for package "${PI_AGENT_IMPORT_BASE}": ${source}`);
  }
  parsePiAgentVersion(value);
  return value;
}

export function pinPiAgentImport(source: string, specifier: string): string {
  const version = parsePiAgentVersion(specifier);
  assertCurrentPiAgentImportShape(source);

  if (source.match(PI_AGENT_IMPORT_VERSION_PATTERN)?.length !== 1) {
    throw new Error(
      'Expected exactly one PI_AGENT_IMPORT_VERSION in m.cli/u/u.resolve.pkg.ts',
    );
  }

  return source.replace(
    PI_AGENT_IMPORT_VERSION_PATTERN,
    `const PI_AGENT_IMPORT_VERSION = '${version}' as const;`,
  );
}

/**
 * Helpers:
 */
function assertCurrentPiAgentImportShape(source: string) {
  if (!source.includes(PI_AGENT_IMPORT_BASE_LINE)) {
    throw new Error(
      'Could not locate PI_AGENT_IMPORT_BASE in m.cli/u/u.resolve.pkg.ts',
    );
  }

  if (!source.includes(PI_AGENT_IMPORT_EXPRESSION)) {
    throw new Error(
      'Could not locate PI_AGENT_IMPORT expression in m.cli/u/u.resolve.pkg.ts',
    );
  }
}

function parsePiAgentVersion(specifier: string) {
  const prefix = `${PI_AGENT_IMPORT_BASE}@`;
  if (!specifier.startsWith(prefix)) {
    throw new Error(`Expected pinned Pi coding agent npm specifier: ${specifier}`);
  }

  const version = specifier.slice(prefix.length);
  const parsed = Semver.parse(version);
  if (parsed.error || Semver.toString(parsed.version) !== version) {
    throw new Error(`Expected pinned Pi coding agent npm specifier: ${specifier}`);
  }
  return version;
}
