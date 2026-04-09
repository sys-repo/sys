import type * as dt from '@sys/driver-deno/t';
import { Fs } from '@sys/fs';

export type PrepPaths = {
  rootDenoJson: string;
  cliTmplFile: string;
  cliCodeFile: string;
};

export type DenoFileVersionLib = Pick<dt.DenoFileLib, 'workspaceVersion'>;

export const PATH = {
  fromRoot(root: string): PrepPaths {
    return {
      rootDenoJson: Fs.join(root, 'deno.json'),
      cliTmplFile: Fs.join(root, 'code/sys.tools/src/cli.tmpl/m.cli.ts'),
      cliCodeFile: Fs.join(root, 'code/sys.tools/src/cli.code/m.cli.ts'),
    };
  },
} as const;

export async function resolveTmplVersion(
  source: string,
  denoFile: DenoFileVersionLib,
): Promise<string> {
  const version = await denoFile.workspaceVersion('@sys/tmpl', source, { walkup: false });
  if (typeof version !== 'string') {
    throw new Error(`Missing workspace version for package "@sys/tmpl": ${source}`);
  }
  return version;
}

export async function resolveDriverAgentVersion(
  source: string,
  denoFile: DenoFileVersionLib,
): Promise<string> {
  const version = await denoFile.workspaceVersion('@sys/driver-agent', source, { walkup: false });
  if (typeof version !== 'string') {
    throw new Error(`Missing workspace version for package "@sys/driver-agent": ${source}`);
  }
  return version;
}

export function pinTmplSpecifier(source: string, version: string): string {
  const pinned = `jsr:@sys/tmpl@${version}`;
  const pattern = /const TMPL_JSR_SPECIFIER = 'jsr:@sys\/tmpl(?:@[^']+)?';/;
  if (!pattern.test(source)) {
    throw new Error('Could not locate TMPL_JSR_SPECIFIER constant in cli.tmpl/m.cli.ts');
  }
  return source.replace(pattern, `const TMPL_JSR_SPECIFIER = '${pinned}';`);
}

export function pinDriverAgentPiCliSpecifier(source: string, version: string): string {
  const pinned = `jsr:@sys/driver-agent@${version}/pi/cli`;
  const pattern = /const DRIVER_AGENT_PI_CLI_JSR_SPECIFIER = 'jsr:@sys\/driver-agent(?:@[^']+)?\/pi\/cli';/;
  if (!pattern.test(source)) {
    throw new Error('Could not locate DRIVER_AGENT_PI_CLI_JSR_SPECIFIER constant in cli.code/m.cli.ts');
  }
  return source.replace(pattern, `const DRIVER_AGENT_PI_CLI_JSR_SPECIFIER = '${pinned}';`);
}
