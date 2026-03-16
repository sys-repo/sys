import { type t, Str } from './common.ts';

export function createStageEntrypoint(
  targetEntryRel: t.StringPath,
  options: { hasDefaultExport: boolean },
): string {
  const specifier = targetEntryRel.startsWith('.') ? targetEntryRel : `./${targetEntryRel}`;
  const targetDir = specifier.replace(/\/src\/[^/]+\.ts$/, '');
  if (options.hasDefaultExport) {
    return `${Str.dedent(`
      import * as target from '${specifier}';
      export const targetEntry = '${specifier}';
      export const targetDir = '${targetDir}';
      export default target.default;
      export * from '${specifier}';
    `)}\n`;
  }

  return `${Str.dedent(`
    import * as target from '${specifier}';
    export const targetEntry = '${specifier}';
    export const targetDir = '${targetDir}';
    export * from '${specifier}';
  `)}\n`;
}
