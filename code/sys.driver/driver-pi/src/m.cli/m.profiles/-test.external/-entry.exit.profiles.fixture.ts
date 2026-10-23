import type { t } from './-entry.exit.support.fixture.ts';

export async function main(input: { argv?: readonly string[] } = {}) {
  const scenario = input.argv?.[0];
  if (scenario === 'unexpected-rejection') throw new Error('unowned programmer failure');
  if (scenario === 'spawn-failure') throw new Deno.errors.NotFound('fixture spawn failure');
  if (scenario === 'help') return { kind: 'help' as const, input, text: '' };
  if (scenario === 'exit') return { kind: 'exit' as const, input };
  if (scenario === 'gui-quit' || scenario === 'gui-cancel') {
    const outcome = scenario === 'gui-quit' ? 'quit' as const : 'external-cancellation' as const;
    return { kind: 'gui' as const, input, parsed: { _: [] }, outcome };
  }
  if (scenario === 'run') {
    const output: t.Process.InheritOutput = JSON.parse(input.argv?.[1] ?? '{}');
    console.info(`fixture run ${JSON.stringify(output)}`);
    return { kind: 'run' as const, input, parsed: { _: [] }, output };
  }
  console.info('fixture presented failure');
  return { kind: 'gui' as const, input, parsed: { _: [] }, outcome: 'failed' as const };
}

export const Profiles = Object.freeze({
  main,
  run(): Promise<never> {
    return Promise.reject(new Error('fixture run is unavailable'));
  },
  menu(): Promise<never> {
    return Promise.reject(new Error('fixture menu is unavailable'));
  },
});
