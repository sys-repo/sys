import { type t, Str } from './common.ts';

export function createStageEntrypoint(targetDirRel: t.StringPath): string {
  const targetDir = targetDirRel.startsWith('.') ? targetDirRel : `./${targetDirRel}`;
  return `${Str.dedent(`
    export const targetDir = '${targetDir}';
  `)}\n`;
}
