import { type t } from './common.ts';
import { cli } from './m.cli.ts';

/**
 * Programmatic clipboard helpers for the `@sys/tools/cp` surface.
 */
export const ClipboardTools: t.ClipboardToolsLib = {
  cli,
};
