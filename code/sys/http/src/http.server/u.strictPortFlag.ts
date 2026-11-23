/** Validate the owner CLI flag before Args.parse coerces unknown boolean values to true. */
export function assertStrictPortFlag(argv: readonly string[]): void {
  let seen = false;
  for (const arg of argv) {
    if (arg === '--') break;
    if (arg !== '--strict-port' && !arg.startsWith('--strict-port=')) continue;
    if (seen) throw new Error('--strict-port may only be specified once.');
    if (arg !== '--strict-port' && arg !== '--strict-port=true' && arg !== '--strict-port=false') {
      throw new Error('Use --strict-port, --strict-port=true, or --strict-port=false.');
    }
    seen = true;
  }
}
