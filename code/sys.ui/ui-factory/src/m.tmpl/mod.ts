/**
 * @module
 * File-system templates for `@sys/ui-factory`.
 */
import { Tmpl } from './m.Tmpl.ts';

export { Tmpl };
export default Tmpl;

/** Dispatch to CLI prompt if run from the command line. */
if (import.meta.main) Tmpl.cli();
