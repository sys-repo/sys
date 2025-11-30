/**
 * Exports:
 */
export type * from './t.lib.ts';
export type * from './t/t.format.ts';
export type * from './t/t.keepAlive.ts';
export type * from './t/t.keyboard.ts';
export type * from './t/t.prompt.ts';
export type * from './t/t.screen.ts';
export type * from './t/t.spinner.ts';
export type * from './t/t.table.ts';

/** Response from `Cli.copyToClipboard` method. */
export type CliCopyResult = { ok: true } | { ok: false; error: Error; tried: string[] };
