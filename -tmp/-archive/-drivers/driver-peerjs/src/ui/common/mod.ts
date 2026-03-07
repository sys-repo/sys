import { pkg } from '../../pkg.ts';

export * from '../../common.ts';
export * from './libs.ts';
export * from './ui.Icons.ts';

/**
 * CRDT/local-storage:
 */
export const STORAGE_KEY = {
  DEV: `dev:${pkg.name}:crdt`,
} as const;
