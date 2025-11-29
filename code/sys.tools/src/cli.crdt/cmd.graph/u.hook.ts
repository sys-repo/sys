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

  const url = new URL(path, 'file://');
  const mod = await import(url.href);
  return mod as t.DocumentGraphHookModule;
}
