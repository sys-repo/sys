import { describe, expect, it } from '../../../-test.ts';
import { Esm } from '../../mod.ts';

describe('Esm.Plan.build', () => {
  const decision = (key: string) =>
    Esm.Policy.decide({
      policy: { mode: 'latest' },
      subject: {
        entry: { module: Esm.parse(`jsr:${key}@1.0.0`), target: ['deno.json'] },
        current: '1.0.0',
        available: ['1.1.0'],
      },
    });

  const node = (key: string) => ({ key, decision: decision(key) });

  it('returns an empty ordered plan for empty input', () => {
    const res = Esm.Plan.build({ nodes: [], edges: [] });

    expect(res.ok).to.eql(true);
    if (!res.ok) return;
    expect(res.items).to.eql([]);
  });

  it('returns a stable order for independent nodes', () => {
    const res = Esm.Plan.build({
      nodes: [node('@sys/c'), node('@sys/a'), node('@sys/b')],
      edges: [],
    });

    expect(res.ok).to.eql(true);
    if (!res.ok) return;

    expect(res.items.map((item) => item.node.key)).to.eql(['@sys/a', '@sys/b', '@sys/c']);
    expect(res.items.map((item) => item.index)).to.eql([0, 1, 2]);
  });

  it('orders a dependency chain topologically', () => {
    const res = Esm.Plan.build({
      nodes: [node('@sys/app'), node('@sys/core'), node('@sys/net')],
      edges: [
        { from: '@sys/core', to: '@sys/net' },
        { from: '@sys/net', to: '@sys/app' },
      ],
    });

    expect(res.ok).to.eql(true);
    if (!res.ok) return;

    expect(res.items.map((item) => item.node.key)).to.eql(['@sys/core', '@sys/net', '@sys/app']);
    expect(res.items[1].after).to.eql(['@sys/core']);
    expect(res.items[2].after).to.eql(['@sys/net']);
  });

  it('keeps deterministic order across branching edges', () => {
    const res = Esm.Plan.build({
      nodes: [node('@sys/app'), node('@sys/ui'), node('@sys/core'), node('@sys/net')],
      edges: [
        { from: '@sys/core', to: '@sys/net' },
        { from: '@sys/core', to: '@sys/ui' },
        { from: '@sys/net', to: '@sys/app' },
        { from: '@sys/ui', to: '@sys/app' },
      ],
    });

    expect(res.ok).to.eql(true);
    if (!res.ok) return;

    expect(res.items.map((item) => item.node.key)).to.eql([
      '@sys/core',
      '@sys/net',
      '@sys/ui',
      '@sys/app',
    ]);
    expect(res.items[3].after).to.eql(['@sys/net', '@sys/ui']);
  });

  it('returns the remaining nodes when a cycle is detected', () => {
    const res = Esm.Plan.build({
      nodes: [node('@sys/a'), node('@sys/b'), node('@sys/c')],
      edges: [
        { from: '@sys/a', to: '@sys/b' },
        { from: '@sys/b', to: '@sys/c' },
        { from: '@sys/c', to: '@sys/a' },
      ],
    });

    expect(res.ok).to.eql(false);
    if (res.ok || !('cycle' in res)) return;

    expect(res.cycle.keys).to.eql(['@sys/a', '@sys/b', '@sys/c']);
  });

  it('detects a self-cycle', () => {
    const res = Esm.Plan.build({
      nodes: [node('@sys/a')],
      edges: [{ from: '@sys/a', to: '@sys/a' }],
    });

    expect(res.ok).to.eql(false);
    if (res.ok || !('cycle' in res)) return;
    expect(res.cycle.keys).to.eql(['@sys/a']);
  });

  it('dedupes repeated after keys from duplicate edges', () => {
    const res = Esm.Plan.build({
      nodes: [node('@sys/a'), node('@sys/b')],
      edges: [
        { from: '@sys/a', to: '@sys/b' },
        { from: '@sys/a', to: '@sys/b' },
      ],
    });

    expect(res.ok).to.eql(true);
    if (!res.ok) return;
    expect(res.items.map((item) => item.node.key)).to.eql(['@sys/a', '@sys/b']);
    expect(res.items[1].after).to.eql(['@sys/a']);
  });

  it('rejects duplicate node keys', () => {
    const res = Esm.Plan.build({
      nodes: [node('@sys/a'), node('@sys/a')],
      edges: [],
    });

    expect(res.ok).to.eql(false);
    if (res.ok || !('invalid' in res)) return;
    expect(res.invalid).to.eql({ code: 'node:duplicate-key', keys: ['@sys/a'] });
  });

  it('rejects edges that reference unknown nodes', () => {
    const res = Esm.Plan.build({
      nodes: [node('@sys/a')],
      edges: [{ from: '@sys/a', to: '@sys/missing' }],
    });

    expect(res.ok).to.eql(false);
    if (res.ok || !('invalid' in res)) return;
    expect(res.invalid).to.eql({ code: 'edge:unknown-node', keys: ['@sys/missing'] });
  });
});
