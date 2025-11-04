export type * as t from './t.ts';

export { pkg } from '../pkg.ts';
export * from './libs.ts';
export * from './u.fmt.ts';
export * from './u.fs.detectRepoRoot.ts';
export * from './u.keepAlive.ts';
export * from './u.prompt.ts';

/**
 * Constants:
 */
export const EXCLUDE = ['**/node_modules/', '**/.git/', '**/.DS_Store'] as const;
