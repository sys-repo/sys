import { type t } from '../../common.ts';
import { eqlPath } from './u.resolve.ts';

export type Direction = 1 | -1;
export type Block = {
  readonly index: number;
  readonly start: number;
  readonly end: number;
  readonly targets: readonly t.KeyValue.Cursor.Item[];
};
export type TargetArgs = {
  readonly items: readonly t.KeyValue.Item[];
  readonly cursorItems: readonly t.KeyValue.Cursor.Item[];
  readonly current: t.KeyValue.Cursor.Item;
  readonly direction: Direction;
};

/** Resolve the next cursor target at hr-delimited block granularity. */
export function blockTarget(args: TargetArgs): t.KeyValue.Cursor.Item | undefined {
  const current = args.cursorItems.find((item) => eqlPath(item.target, args.current.target));
  if (!current) return undefined;

  const currentIndex = args.items.findIndex((item) => item === current.item);
  if (currentIndex < 0) return undefined;

  const blocks = toBlocks(args.items, args.cursorItems);
  const currentBlock = isDelimiter(current.item)
    ? undefined
    : blocks.find((block) => block.start <= currentIndex && currentIndex <= block.end);

  if (currentBlock) {
    const edge = blockEdgeTarget(currentBlock, current, args.direction);
    if (edge) return edge;
  }

  return neighboringBlockEdge(blocks, currentIndex, currentBlock, args.direction);
}

/** Resolve direct-sibling hr-delimited blocks for cursor-addressable items. */
export function toBlocks(
  items: readonly t.KeyValue.Item[],
  cursorItems: readonly t.KeyValue.Cursor.Item[],
): readonly Block[] {
  const blocks: Block[] = [];
  let start = 0;

  items.forEach((item, index) => {
    if (!isDelimiter(item)) return;
    blocks.push(toBlock(blocks.length, start, index - 1, items, cursorItems));
    start = index + 1;
  });

  blocks.push(toBlock(blocks.length, start, items.length - 1, items, cursorItems));
  return blocks;
}

/** Whether a KeyValue item structurally delimits cursor blocks. */
export function isDelimiter(item: t.KeyValue.Item) {
  return item.kind === 'hr';
}

function toBlock(
  index: number,
  start: number,
  end: number,
  items: readonly t.KeyValue.Item[],
  cursorItems: readonly t.KeyValue.Cursor.Item[],
): Block {
  const targets = cursorItems.filter((item) => {
    if (isDelimiter(item.item)) return false;
    const rawIndex = items.findIndex((candidate) => candidate === item.item);
    if (rawIndex < 0) return false;
    return start <= rawIndex && rawIndex <= end;
  });
  return { index, start, end, targets };
}

function blockEdgeTarget(
  block: Block,
  current: t.KeyValue.Cursor.Item,
  direction: Direction,
): t.KeyValue.Cursor.Item | undefined {
  const targets = block.targets;
  const currentIndex = targets.findIndex((item) => eqlPath(item.target, current.target));
  if (currentIndex < 0) return undefined;

  if (direction > 0 && currentIndex < targets.length - 1) return targets[targets.length - 1];
  if (direction < 0 && currentIndex > 0) return targets[0];
  return undefined;
}

function neighboringBlockEdge(
  blocks: readonly Block[],
  currentIndex: number,
  currentBlock: Block | undefined,
  direction: Direction,
): t.KeyValue.Cursor.Item | undefined {
  const hasCurrentBlock = !!currentBlock;
  const isAfterCurrent = (block: Block) =>
    hasCurrentBlock ? block.index > currentBlock.index : block.start > currentIndex;
  const isBeforeCurrent = (block: Block) =>
    hasCurrentBlock ? block.index < currentBlock.index : block.end < currentIndex;
  const candidates = direction > 0
    ? blocks.filter(isAfterCurrent)
    : Array.from(blocks).reverse().filter(isBeforeCurrent);
  const block = candidates.find((block) => block.targets.length > 0);
  if (!block) return undefined;
  return direction > 0 ? block.targets[0] : block.targets[block.targets.length - 1];
}
