import { type t, Shard } from './common.ts';

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
  if (isLocalHostname(url.hostname)) return args.href;

  const shard = Shard.policy(policy.total, policy.strategy).pick(args.asset.hash);
  const host = `${shard}.${url.hostname}`;
  return `${url.protocol}//${host}${url.port ? `:${url.port}` : ''}${url.pathname}${url.search}${url.hash}`;
}

function toPolicy(kind: t.SpecTimelineAsset['kind'], layout?: t.SlugClientLayout) {
  if (kind === 'video') return layout?.shard?.video;
  if (kind === 'image') return layout?.shard?.image;
  return undefined;
}

function isLocalHostname(hostname: string): boolean {
  const host = String(hostname ?? '').toLowerCase();
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
}
