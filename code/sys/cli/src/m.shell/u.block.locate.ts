import { TextBlock } from '@sys/text/block';
import { type t } from './common.ts';
import { parseModel, renderLines } from './u.block.body.ts';
import { markers } from './u.block.markers.ts';

export type LocatedBlock = {
  readonly state: t.Shell.Block.State;
  readonly markers: t.Shell.Block.Markers;
  readonly block: ReturnType<typeof TextBlock.detect>;
};

export function locate(args: t.Shell.Block.DetectArgs): LocatedBlock {
  const currentMarkers = markers(args.owner);
  const current = TextBlock.detect({ text: args.text, markers: currentMarkers });
  return locatedFromBlock(args.owner, currentMarkers, current);
}

export function mapInvalidReason(reason: string): 'partial-markers' | 'multiple-blocks' {
  return reason === 'multiple-blocks' ? 'multiple-blocks' : 'partial-markers';
}

/**
 * Helpers:
 */
function locatedFromBlock(
  owner: t.Shell.Owner,
  markerSet: t.Shell.Block.Markers,
  block: ReturnType<typeof TextBlock.detect>,
): LocatedBlock {
  if (block.kind === 'missing') return { state: block, markers: markerSet, block };
  if (block.kind === 'invalid') {
    return {
      state: { kind: 'invalid', reason: mapInvalidReason(block.reason) },
      markers: markerSet,
      block,
    };
  }

  const model = parseModel(owner, block.block);
  return {
    state: {
      kind: 'present',
      model,
      stale: block.block !== renderedBlock(owner, model, block.newline),
    },
    markers: markerSet,
    block,
  };
}

function renderedBlock(
  owner: t.Shell.Owner,
  model: t.Shell.ManagedModel,
  newline: '\n' | '\r\n',
): string {
  return TextBlock.render({
    markers: markers(owner),
    lines: renderLines({ owner, model, newline }),
    newline,
  });
}
