import { Str } from '../common.ts';

/** Compose already-rendered help/table blocks using the shared help frame. */
export function composeHelpBlocks(...blocks: readonly string[]): string {
  const body = blocks.map((block) => Str.trimEdgeNewlines(block)).filter((block) =>
    block.length > 0
  )
    .join('\n\n');
  return `\n${body}\n`;
}
