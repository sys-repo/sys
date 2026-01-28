/** Type re-exports. */
export type * from './t.lib.ts';
export type * from './t/t.ext.prompt.ts';
export type * from './t/t.fmt.ts';
export type * from './t/t.input.ts';
export type * from './t/t.keepAlive.ts';
export type * from './t/t.keyboard.ts';
export type * from './t/t.screen.ts';
export type * from './t/t.spinner.ts';
export type * from './t/t.table.ts';

/** Response from `Cli.copyToClipboard` method. */
export type CliCopyResult = { ok: true } | { ok: false; error: Error; tried: string[] };
