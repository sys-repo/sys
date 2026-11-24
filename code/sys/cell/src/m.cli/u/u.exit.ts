import process from 'node:process';

/** Publish one CLI outcome to both runtimes before Node-backed terminal exit hooks run. */
export function setExitCode(code: number): void {
  Deno.exitCode = code;
  process.exitCode = code;
}
