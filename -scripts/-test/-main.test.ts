import { describe, expect, it } from '@sys/testing/server';
import { run } from '../main.ts';

describe('scripts/main prep orchestration', () => {
  it('--prep-all passes executed prep count into the final prep:ci close-out', async () => {
    const calls: unknown[] = [];
    const api = fakeLib({
      prep: async (context?: unknown) => {
        calls.push(['prep', context]);
        return 6;
      },
      prepCiDeno: async () => {
        calls.push(['prepCiDeno']);
      },
      prepCi: async (options?: unknown) => {
        calls.push(['prepCi', options]);
      },
    });

    await run({ 'prep-all': true }, api);

    expect(calls).to.eql([
      ['prep', undefined],
      ['prepCiDeno'],
      ['prepCi', { versionFilter: 'all', prepared: 6, final: true, ensureGraph: false }],
    ]);
  });

  it('--prep-pkg only syncs package metadata', async () => {
    const calls: unknown[] = [];
    const api = fakeLib({
      prepPkg: async () => {
        calls.push(['prepPkg']);
      },
    });

    await run({ 'prep-pkg': true }, api);

    expect(calls).to.eql([
      ['prepPkg'],
    ]);
  });

  it('--prep-all forwards the prep context into the canonical prep lane', async () => {
    const calls: unknown[] = [];
    const api = fakeLib({
      prep: async (context?: unknown) => {
        calls.push(['prep', context]);
        return 2;
      },
      prepCiDeno: async () => {
        calls.push(['prepCiDeno']);
      },
      prepCi: async (options?: unknown) => {
        calls.push(['prepCi', options]);
      },
    });

    await run({ 'prep-all': true, 'ahead-only': true, 'prep-context': 'bump' }, api);

    expect(calls).to.eql([
      ['prep', 'bump'],
      ['prepCiDeno'],
      ['prepCi', { versionFilter: 'ahead', prepared: 2, final: true, ensureGraph: false }],
    ]);
  });

  it('--prep-ci does not invent a final workspace prep close-out', async () => {
    const calls: unknown[] = [];
    const api = fakeLib({
      prepCi: async (options?: unknown) => {
        calls.push(['prepCi', options]);
      },
    });

    await run({ 'prep-ci': true }, api);

    expect(calls).to.eql([
      ['prepCi', { versionFilter: 'all' }],
    ]);
  });

  it('--test runs root script specs before workspace module tests', async () => {
    const calls: unknown[] = [];
    const api = fakeLib({
      test: async () => {
        calls.push(['test']);
      },
    });

    await run({ test: true }, api);

    expect(calls).to.eql([
      ['test'],
    ]);
  });
});

function fakeLib(override: Partial<ReturnType<typeof baseLib>> = {}) {
  return { ...baseLib(), ...override };
}

function baseLib() {
  return {
    dry: async () => {},
    test: async () => {},
    info: async () => {},
    clean: async () => {},
    lint: async () => {},
    bump: async () => undefined,
    prep: async (_context?: unknown) => 0,
    prepPkg: async () => {},
    prepCi: async (_options?: unknown) => {},
    prepCiDeno: async () => {},
  } as const;
}
