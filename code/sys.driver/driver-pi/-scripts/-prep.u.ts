import { Fs } from '@sys/fs';

export type PrepPaths = {
  rootDepsYaml: string;
  resolvePkgFile: string;
};

export type DenoDepsLib = {
  from(input: string): Promise<{ error?: unknown; data?: { deps?: unknown } }>;
  findImport(deps: unknown, input: string): string | undefined;
};

export const PATH = {
  fromRoot(root: string): PrepPaths {
    return {
      rootDepsYaml: Fs.join(root, 'deps.yaml'),
      resolvePkgFile: Fs.join(root, 'code/sys.driver/driver-pi/src/m.core/m.cli/u.resolve.pkg.ts'),
    };
  },
} as const;

export async function resolvePiCodingAgentImport(
  source: string,
  denoDeps: DenoDepsLib,
): Promise<string> {
  const res = await denoDeps.from(source);
  if (res.error) throw res.error;

  const value = denoDeps.findImport(res.data?.deps, 'npm:@mariozechner/pi-coding-agent');
  if (typeof value !== 'string') {
    throw new Error(`Missing deps import for package "npm:@mariozechner/pi-coding-agent": ${source}`);
  }
  return value;
}

export function pinPiCodingAgentImport(source: string, specifier: string): string {
  const pattern = /export const PI_CODING_AGENT_IMPORT = 'npm:@mariozechner\/pi-coding-agent(?:@[^']+)?' as const;/;
  if (!pattern.test(source)) {
    throw new Error('Could not locate PI_CODING_AGENT_IMPORT constant in m.core/m.cli/u.resolve.pkg.ts');
  }
  return source.replace(pattern, `export const PI_CODING_AGENT_IMPORT = '${specifier}' as const;`);
}
