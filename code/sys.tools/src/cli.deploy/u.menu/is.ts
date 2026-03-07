/**
 * Name validity for a deployment.
 */
export const ValidName = {
  test(name: string) {
    return /^[a-zA-Z0-9]+([.+-][a-zA-Z0-9]+)*$/.test(name);
  },
  hint: 'Use letters, numbers, ".", "-", or "+" only (no spaces, no leading/trailing separators).',
} as const;
