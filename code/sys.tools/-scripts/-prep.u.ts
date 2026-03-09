import { Fs } from '@sys/fs';
import type * as t from '@sys/types';
import type * as dt from '@sys/driver-deno/t';

export type PrepPaths = {
  rootDenoJson: string;
  cliTmplFile: string;
};

export type DenoFileVersionLib = Pick<dt.DenoFileLib, 'workspaceVersion'>;

export const PATH = {
  fromRoot(root: string): PrepPaths {
    return {
      rootDenoJson: Fs.join(root, 'deno.json'),
      cliTmplFile: Fs.join(root, 'code/sys.tools/src/cli.tmpl/m.cli.ts'),
    };
  },
} as const;

export async function resolveTmplVersion(source: string, denoFile: DenoFileVersionLib): Promise<string> {
  const version = await denoFile.workspaceVersion('@sys/tmpl', source, { walkup: false });
  if (typeof version !== 'string') {
    throw new Error(`Missing workspace version for package "@sys/tmpl": ${source}`);
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
