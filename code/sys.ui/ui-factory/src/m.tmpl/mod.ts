/**
 * @module
 * File-system templates for `@sys/ui-factory`.
 */
import { Tmpl } from './m.Tmpl.ts';

export { Tmpl };
export default Tmpl;

/** Dispatch to CLI prompt if run within the command-line. */
if (import.meta.main) Tmpl.cli();
