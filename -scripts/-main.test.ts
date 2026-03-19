import { describe, expect, it } from '@sys/testing/server';
import { run } from './main.ts';

describe('scripts/main prep orchestration', () => {
  it('--prep-all passes executed prep count into the final prep:ci close-out', async () => {
    const calls: unknown[] = [];
    const api = fakeLib({
      prep: async () => {
        calls.push(['prep']);
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
      ['prep'],
      ['prepCiDeno'],
      ['prepCi', { versionFilter: 'all', prepared: 6, final: true }],
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
    prep: async () => 0,
    prepCi: async (_options?: unknown) => {},
    prepCiDeno: async () => {},
  } as const;
}
