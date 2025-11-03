export * from '../common.ts';

/**
 * Libs:
 */
export { Crdt } from '@sys/driver-automerge/fs';

/**
 * Constants:
 */
export const D = {
  toolname: 'CRDT Tools',
  Sync: { server: 'waiheke.sync.db.team' },
  Path: {
    meta: './.data',
    repo: './.data/repo',
    index: './.data/index.json',
  },
} as const;
