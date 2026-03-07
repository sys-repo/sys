import { type t, Is, Shard } from './common.ts';

/**
 * Rewrite asset URL host to a shard-prefixed host when policy is configured.
 */
export function rewriteShardHost(args: {
  href: string;
  asset: t.SpecTimelineAsset;
  layout?: t.SlugClientLayout;
}): string {
  const policy = toPolicy(args.asset.kind, args.layout);
  if (!policy) return args.href;
  if (!args.asset.hash) return args.href;

  const url = new URL(args.href);
  const isLocal = Is.localhost(url.href);

  const shard = Shard.policy(policy.total, policy.strategy).pick(args.asset.hash);
  const hostMode = policy.host ?? 'prefix-shard';
  const pathMode = policy.path ?? 'preserve';

  const host = !isLocal && hostMode === 'prefix-shard' ? `${shard}.${url.hostname}` : url.hostname;
  const path = toPath({ pathname: url.pathname, pathMode, hostMode, isLocal, shard });
  return `${url.protocol}//${host}${url.port ? `:${url.port}` : ''}${path}${url.search}${url.hash}`;
}

function toPolicy(kind: t.SpecTimelineAsset['kind'], layout?: t.SlugClientLayout) {
  if (kind === 'video') return layout?.shard?.video;
  if (kind === 'image') return layout?.shard?.image;
  return undefined;
}

function toRootFilename(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean);
  const filename = parts.at(-1) ?? '';
  return filename ? `/${filename}` : pathname;
}

function toPath(args: {
  pathname: string;
  pathMode: 'preserve' | 'root-filename';
  hostMode: 'prefix-shard' | 'none';
  isLocal: boolean;
  shard: number;
}) {
  if (args.pathMode !== 'root-filename') return args.pathname;
  if (args.isLocal && args.hostMode === 'prefix-shard') {
    return toLocalShardPath(args.pathname, args.shard);
  }
  return toRootFilename(args.pathname);
}

function toLocalShardPath(pathname: string, shard: number): string {
  const parts = pathname.split('/').filter(Boolean);
  const filename = parts.at(-1);
  if (!filename) return pathname;

  let baseParts = parts.slice(0, -1);
  const assetsIndex = baseParts.lastIndexOf('assets');
  if (assetsIndex >= 0) {
    baseParts = baseParts.slice(0, assetsIndex);
  } else if (baseParts.at(-1)?.startsWith('shard.')) {
    baseParts = baseParts.slice(0, -1);
  }

  return `/${[...baseParts, `shard.${shard}`, filename].join('/')}`;
}
