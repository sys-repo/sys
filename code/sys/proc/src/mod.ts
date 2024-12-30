/**
 * @module
 * Tools for working with spawned child processes on modern POSIX-based systems
 * (macOS, Linux, and similar “x-unix-like” environments) using Deno (aka. WinterCG
 * compatible) runtimes.
 *
 * @example
 * Running a short lived shell command (synchronous):
 * ```ts
 * import { Process } from '@sys/proc';
 *
 * const sh = Process.sh('./path/to/cwd');
 * const res = await sh.run('echo foo');     // ← res.code == 0 (success)
 *
 * // OR ↓
 *
 * const args = ['eval', 'console.log("👋 hello world")'];
 * const res = await Process.invoke({ args });
 * ```
 *
 * @example
 * Spawning a long-running child process (asynchronous):
 * ```ts
 * import { Process } from '@sys/proc';
 *
 * const readySignal = Process.Signal.ready;
 * const cmd = `
 *   Deno.serve({ port: 1234 }, () => new Response('👋 hello world'));
 *   console.info('${Process.Signal.ready}');
 * `;
 * const args = ['eval', cmd];
 * const proc = await Process.spawn({ args, readySignal, silent: true }).whenReady();
 *
 * await proc.whenReady();
 *
 * // ...
 *
 * await proc.dispose();
 * ```
 */
export { pkg } from './pkg.ts';

/**
 * Library
 */
export { Process } from './m.Process/mod.ts';
