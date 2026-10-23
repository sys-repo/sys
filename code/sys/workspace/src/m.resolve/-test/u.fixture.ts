import type { t } from '../../-test.ts';

/** Causally relevant Deno 2.9.5 diagnostic captured during incident reproduction. */
export const minimumDependencyPolicy = {
  error:
    'Could not find version. A newer matching version was found, but it was not used because it was newer than the specified minimum dependency date of 2016-07-06 21:36:09 UTC',
  cutoff: '2016-07-06T21:36:09Z',
} as const;

type OutputArgs = { success: boolean; stdout?: string; stderr?: string };

export function invokeOutput(args: OutputArgs): Promise<t.Process.Output> {
  return Promise.resolve(output(args));
}

function output(args: OutputArgs): t.Process.Output {
  const stdout = args.stdout ?? '';
  const stderr = args.stderr ?? '';
  return {
    code: args.success ? 0 : 1,
    success: args.success,
    signal: null,
    stdout: new TextEncoder().encode(stdout),
    stderr: new TextEncoder().encode(stderr),
    text: { stdout, stderr },
    toString() {
      return args.success ? stdout : stderr;
    },
  };
}
