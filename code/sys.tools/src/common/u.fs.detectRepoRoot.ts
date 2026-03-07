import { Fs } from './libs.ts';

/**
 * Resolve the monorepo root.
 * Preference: VCS root ('.git'), otherwise topmost ancestor containing 'deno.json'.
 */
export async function detectRepoRoot(startDir: string): Promise<string> {
  let curr = Fs.Path.resolve(startDir);
  let topmostWithDeno: string | undefined;

  while (true) {
    const gitDir = Fs.Path.join(curr, '.git');
    if (await Fs.exists(gitDir)) return curr;

    const denoJson = Fs.Path.join(curr, 'deno.json');
    if (await Fs.exists(denoJson)) topmostWithDeno = curr;

    const parent = Fs.Path.dirname(curr);
    if (parent === curr) return topmostWithDeno ?? Fs.Path.resolve(startDir);
    curr = parent;
  }
}
