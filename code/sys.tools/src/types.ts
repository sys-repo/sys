/**
 * @module
 * @types Type-library module.
 */
export type * from './cli.clipboard/t.ts';
export type * from './cli.crdt/t.ts';
export type * from './cli.fs/t.ts';
export type * from './cli.update/t.ts';
export type * from './cli.video/t.ts';

/**
 * Command line arguments (argv).
 */
export type ToolsCliArgs = { help: boolean };
