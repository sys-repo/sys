import { Fs } from '@sys/fs';
import { Is } from '@sys/std/is';
import { PI_AGENT_IMPORT_BASE } from '../src/m.core/m.cli/u.resolve.pkg.ts';

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
const PI_AGENT_IMPORT_VERSION_PATTERN = /const PI_AGENT_IMPORT_VERSION = '[^']+' as const;/;

export const PATH = {
  fromRoot(root: string): PrepPaths {
    return {
      rootDepsYaml: Fs.join(root, 'deps.yaml'),
      resolvePkgFile: Fs.join(root, 'code/sys.driver/driver-pi/src/m.core/m.cli/u.resolve.pkg.ts'),
    };
  },
} as const;

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
  return value;
}

export function pinPiAgentImport(source: string, specifier: string): string {
  const version = parsePiAgentVersion(specifier);
  assertCurrentPiAgentImportShape(source);

  if (!PI_AGENT_IMPORT_VERSION_PATTERN.test(source)) {
    throw new Error(
      'Could not locate PI_AGENT_IMPORT_VERSION in m.core/m.cli/u.resolve.pkg.ts',
    );
  }

  return source.replace(
    PI_AGENT_IMPORT_VERSION_PATTERN,
    `const PI_AGENT_IMPORT_VERSION = '${version}' as const;`,
  );
}

function assertCurrentPiAgentImportShape(source: string) {
  if (!source.includes(PI_AGENT_IMPORT_BASE_LINE)) {
    throw new Error(
      'Could not locate PI_AGENT_IMPORT_BASE in m.core/m.cli/u.resolve.pkg.ts',
    );
  }

  if (!source.includes(PI_AGENT_IMPORT_EXPRESSION)) {
    throw new Error(
      'Could not locate PI_AGENT_IMPORT expression in m.core/m.cli/u.resolve.pkg.ts',
    );
  }
}

function parsePiAgentVersion(specifier: string) {
  const prefix = `${PI_AGENT_IMPORT_BASE}@`;
  if (!specifier.startsWith(prefix)) {
    throw new Error(`Expected pinned Pi coding agent npm specifier: ${specifier}`);
  }

  const version = specifier.slice(prefix.length);
  if (!version) {
    throw new Error(`Expected pinned Pi coding agent npm specifier: ${specifier}`);
  }
  return version;
}
