export * from '../common.ts';

/**
 * Libs:
 */
export { Crdt } from '@sys/driver-automerge/fs';
export { Immutable } from '@sys/immutable/rfc6902';

/**
 * Constants:
 */
export const D = {
  toolname: 'CRDT Tools',
  Sync: { server: 'waiheke.sync.db.team' },
  Path: {
    repo: './.crdt.repo',
    config: './tools.config.json',
  },
} as const;
