import { Is } from './common.ts';

export type ShardTemplatePaths = {
  readonly source: string;
  readonly staging: string;
  readonly total?: number;
  readonly requireAll?: boolean;
};

export type ShardExpandedPaths = {
  readonly source: string;
  readonly staging: string;
};

export function expandShardTemplatePaths(args: ShardTemplatePaths): ShardExpandedPaths[] {
  const { source, staging } = args;
  const hasTemplate =
    includesShardTemplate(source) || includesShardTemplate(staging);

  if (!hasTemplate) return [{ source, staging }];

  const total = args.total;
  if (!Is.num(total) || !Number.isFinite(total) || total <= 0) {
    return [{ source, staging }];
  }

  const count = Math.floor(total);
  const expanded: ShardExpandedPaths[] = [];
  for (let index = 0; index < count; index += 1) {
    expanded.push({
      source: resolveShardTemplate(source, index, count),
      staging: resolveShardTemplate(staging, index, count),
    });
  }
  return expanded;
}

export function shouldRequireAllShards(args: ShardTemplatePaths): boolean {
  return args.requireAll === true;
}

export function resolveShardTemplate(value: string, shard: number, total: number): string {
  return value.replaceAll('<shard>', String(shard)).replaceAll('<shards>', String(total));
}

export function includesShardTemplate(value: string): boolean {
  return value.includes('<shard>') || value.includes('<shards>');
}
