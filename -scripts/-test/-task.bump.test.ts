import { describe, expect, it } from '@sys/testing/server';
import { orderChildren } from '../task.bump.ts';

describe('scripts/task.bump', () => {
  it('orders bump rows by topological workspace package path order', () => {
    const children = [
      { path: 'code/sys/workspace/deno.json', name: '@sys/workspace' },
      { path: 'code/sys/std/deno.json', name: '@sys/std' },
      { path: 'code/sys/types/deno.json', name: '@sys/types' },
    ];

    const res = orderChildren(children, [
      'code/sys/types',
      'code/sys/std',
      'code/sys/workspace',
    ]);

    expect(res.map((child) => child.name)).to.eql([
      '@sys/types',
      '@sys/std',
      '@sys/workspace',
    ]);
  });

  it('keeps unmatched children at the end in stable path order', () => {
    const children = [
      { path: 'code/sys/workspace/deno.json', name: '@sys/workspace' },
      { path: 'code/extra/zeta/deno.json', name: '@extra/zeta' },
      { path: 'code/sys/std/deno.json', name: '@sys/std' },
      { path: 'code/extra/alpha/deno.json', name: '@extra/alpha' },
    ];

    const res = orderChildren(children, ['code/sys/std', 'code/sys/workspace']);

    expect(res.map((child) => child.name)).to.eql([
      '@sys/std',
      '@sys/workspace',
      '@extra/alpha',
      '@extra/zeta',
    ]);
  });
});
