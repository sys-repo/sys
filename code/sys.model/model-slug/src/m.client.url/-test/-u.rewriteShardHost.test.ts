import { describe, expect, it } from '../../-test.ts';
import { type t, Shard } from '../common.ts';
import { rewriteShardHost } from '../u.rewriteShardHost.ts';

describe('rewriteShardHost', () => {
  const hash = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
  const policy = { strategy: 'prefix-range', total: 64 } as const;

  it('rewrites production host with shard prefix', () => {
    const expected = Shard.policy(policy.total, policy.strategy).pick(hash);
    const href = rewriteShardHost({
      href: 'https://video.cdn.example.com/sample/path/main.webm',
      asset: asset({ kind: 'video', hash }),
      layout: { shard: { video: policy } },
    });
    expect(href).to.eql(`https://${expected}.video.cdn.example.com/sample/path/main.webm`);
  });

  it('does not rewrite localhost hosts', () => {
    const href = rewriteShardHost({
      href: 'http://localhost:4040/sample/path/main.webm',
      asset: asset({ kind: 'video', hash }),
      layout: { shard: { video: policy } },
    });
    expect(href).to.eql('http://localhost:4040/sample/path/main.webm');
  });

  it('does not rewrite when hash is missing', () => {
    const href = rewriteShardHost({
      href: 'https://video.cdn.example.com/sample/path/main.webm',
      asset: asset({ kind: 'video' }),
      layout: { shard: { video: policy } },
    });
    expect(href).to.eql('https://video.cdn.example.com/sample/path/main.webm');
  });

  it('does not rewrite when policy is missing', () => {
    const href = rewriteShardHost({
      href: 'https://video.cdn.example.com/sample/path/main.webm',
      asset: asset({ kind: 'video', hash }),
      layout: {},
    });
    expect(href).to.eql('https://video.cdn.example.com/sample/path/main.webm');
  });

  it('preserves path, query, and hash fragments', () => {
    const expected = Shard.policy(policy.total, policy.strategy).pick(hash);
    const href = rewriteShardHost({
      href: 'https://video.cdn.example.com/sample/path/main.webm?x=1#t=10',
      asset: asset({ kind: 'video', hash }),
      layout: { shard: { video: policy } },
    });
    expect(href).to.eql(`https://${expected}.video.cdn.example.com/sample/path/main.webm?x=1#t=10`);
  });
});

function asset(
  input: Partial<t.SpecTimelineAsset> & Pick<t.SpecTimelineAsset, 'kind'>,
): t.SpecTimelineAsset {
  return {
    kind: input.kind,
    logicalPath: input.logicalPath ?? '/x',
    href: input.href ?? '/x',
    hash: input.hash,
    filename: input.filename,
    shard: input.shard,
    stats: input.stats,
  };
}
