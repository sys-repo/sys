/**
 * @module
 * File-system templates for `@sys/ui-factory`.
 */
import { cli } from './u.cli.ts';

export { cli };
export default cli;

/** Dispatch to CLI prompt if run within the command-line. */
if (import.meta.main) cli();
