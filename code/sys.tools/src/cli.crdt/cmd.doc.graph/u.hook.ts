import { type t } from '../common.ts';

/**
 * Load the document-graph hook module from the given directory, if present.
 */
export async function loadDocumentHook(
  cwd: t.StringDir,
  filename = 'hook.ts',
): Promise<t.DocumentGraphHookModule | undefined> {
  const path = `${cwd}/${filename}`;

  try {
    const stat = await Deno.stat(path);
    if (!stat.isFile) return;
  } catch {
    return;
  }

  /**
   * NOTE: This triggers the JSR "unanalyzable-dynamic-import" warning in CI.
   *
   * Rationale:
   * - The hook is a user-supplied module loaded from the local filesystem at runtime.
   * - Its path cannot be known or rewritten at publish time, so JSR correctly reports it.
   * - This is intentional and safe within our CLI trust boundary.
   * - Will later be replaced by a sandboxed subprocess, but acceptable for now within our current trust boundary.
   */
  const url = new URL(path, 'file://');
  const mod = await import(url.href);
  return mod as t.DocumentGraphHookModule;
}
