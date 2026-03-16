import { type t, Str } from './common.ts';

export function createStageEntrypoint(
  targetDirRel: t.StringPath,
  targetEntryRel: t.StringPath,
): string {
  const targetDir = targetDirRel.startsWith('.') ? targetDirRel : `./${targetDirRel}`;
  const targetEntry = targetEntryRel.startsWith('.') ? targetEntryRel : `./${targetEntryRel}`;
  return `${Str.dedent(`
    export const targetEntry = '${targetEntry}';
    export const targetDir = '${targetDir}';
    export const targetPkg = '${targetDir}/src/pkg.ts';
    export const targetDist = '${targetDir}/dist/';
  `)}\n`;
}
