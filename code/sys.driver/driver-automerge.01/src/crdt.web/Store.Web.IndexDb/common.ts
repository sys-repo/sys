export * from '../common.ts';

export const DEFAULTS = {} as const;

export const NAME = {
  STORE: { repos: 'repos' },
  INDEX: { repos: { dbname_index: 'dbname_index' } },
} as const;
