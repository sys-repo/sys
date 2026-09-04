export const Profiles = Object.freeze({
  main(input: { argv?: readonly string[] } = {}) {
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
  },
  run(): Promise<never> {
    return Promise.reject(new Error('fixture run is unavailable'));
  },
  menu(): Promise<never> {
    return Promise.reject(new Error('fixture menu is unavailable'));
  },
});
