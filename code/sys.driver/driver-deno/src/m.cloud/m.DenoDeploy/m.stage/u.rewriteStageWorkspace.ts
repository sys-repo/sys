import { Fs, Is, Str, type t } from './common.ts';

type O = Record<string, unknown>;

export async function rewriteStageWorkspace(
  root: t.StringDir,
  retain: ReadonlySet<t.StringPath>,
): Promise<void> {
  const path = Fs.join(root, 'deno.json');
  const deno = await Fs.readJson<O>(path);
  if (!deno.ok || !deno.data) throw new Error(`Failed to read staged deno.json: ${path}`);

  const workspace = Array.isArray(deno.data.workspace) ? deno.data.workspace.filter(Is.str) : [];
  const next = workspace.filter((item) => retain.has(wrangle.normalizePackagePath(item)));
  await Fs.writeJson(path, { ...deno.data, workspace: next });
}

/**
 * Helpers:
 */
const wrangle = {
  normalizePackagePath(path: string): t.StringPath {
    return Str.trimTrailingSlashes(Str.trimLeadingDotSlash(path));
  },
} as const;
