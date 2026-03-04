import { Fs } from '@sys/fs';
import type * as t from '@sys/types';

export type PrepPaths = {
  tmplDenoJson: string;
  cliTmplFile: string;
};

export const PATH = {
  fromRoot(root: string): PrepPaths {
    return {
      tmplDenoJson: Fs.join(root, 'code/-tmpl/deno.json'),
      cliTmplFile: Fs.join(root, 'code/sys.tools/src/cli.tmpl/m.cli.ts'),
    };
  },
} as const;

export function assertVersion(input: t.Json, source: string): string {
  const version = (input as { version?: unknown }).version;
  if (typeof version !== 'string') {
    throw new Error(`Expected "version" string field: ${source}`);
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
