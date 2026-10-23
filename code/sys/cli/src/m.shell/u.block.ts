import { TextBlock } from '@sys/text/block';
import type { t } from './common.ts';
import { renderLines } from './u.block.body.ts';
import { locate } from './u.block.locate.ts';
import { markers } from './u.block.markers.ts';
import { remove, update } from './u.block.plan.ts';

/** Managed shell block helpers. */
export const Block: t.Shell.Block.Lib = Object.freeze({
  markers,
  render,
  detect: (args) => locate(args).state,
  update,
  remove,
});

/**
 * Helpers:
 */
function render(args: t.Shell.Block.RenderArgs): string {
  const newline = args.newline ?? '\n';
  return TextBlock.render({ markers: markers(args.owner), lines: renderLines(args), newline });
}
