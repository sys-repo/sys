import { Args, Fs } from './common.ts';
import { PATH, syncPiAgentImport } from './-prep.u.ts';

type CheckArgs = { check?: boolean };

/** Metadata-task grammar; validation completes before any file access. */
export function parseArgs(argv: readonly string[]) {
  const parsed = Args.parse<CheckArgs>([...argv], { boolean: ['check'] });
  // Keep the task's exact grammar: no assignments such as --check=true or extra tokens.
  if (argv.length > 1 || (argv.length === 1 && argv[0] !== '--check')) {
    throw new Error('Expected no arguments or --check');
  }
  return { check: parsed.check === true } as const;
}

if (import.meta.main) {
  const options = parseArgs(Deno.args);
  const root = Fs.resolve(import.meta.dirname ?? '.', '../../../..');
  const result = await syncPiAgentImport(PATH.fromRoot(root), options);
  console.info(`Pi dependency ${result.changed ? 'updated' : 'current'}: ${result.specifier}`);
}
