/**
 * Creates a Deno-aware Worker.
 *
 * - Runs stable in browser and Node (ignores `deno:` field there)
 * - In Deno, inherits permissions *if available* (requires `--unstable-worker-options`)
 */
export function createWorker(url: URL): Worker {
  const base: WorkerOptions = { type: 'module' };

  // Add Deno-specific extension only when supported.
  const denoExt =
    typeof Deno !== 'undefined'
      ? ({ deno: { permissions: 'inherit' as const } } as Record<string, unknown>)
      : {};
  return new Worker(url, { ...base, ...denoExt } as WorkerOptions);
}
