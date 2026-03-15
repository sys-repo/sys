import { type t } from './common.ts';

export function createStageEntrypoint(
  targetEntryRel: t.StringPath,
  options: { hasDefaultExport: boolean },
): string {
  const specifier = targetEntryRel.startsWith('.') ? targetEntryRel : `./${targetEntryRel}`;
  const lines = [
    `import * as target from '${specifier}';`,
    ...(options.hasDefaultExport ? ['export default target.default;'] : []),
    `export * from '${specifier}';`,
  ];
  return `${lines.join('\n')}\n`;
}
