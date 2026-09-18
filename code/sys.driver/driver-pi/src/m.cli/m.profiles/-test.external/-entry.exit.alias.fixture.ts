export function main(input: { argv?: readonly string[] } = {}) {
  if (input.argv?.[0] === 'unexpected-rejection') {
    return Promise.reject(new Error('unowned programmer failure'));
  }
  console.info('fixture presented failure');
  return Promise.resolve({
    kind: 'gui' as const,
    input,
    parsed: { _: [] },
    outcome: 'failed' as const,
  });
}

export function exitCode(result: { kind: string; outcome?: string }): 0 | 1 {
  return result.kind === 'gui' && result.outcome === 'failed' ? 1 : 0;
}
