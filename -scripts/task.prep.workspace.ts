import { Fs, Json } from './common.ts';
import type * as t from './t.ts';

export function normalizeWorkspace(
  input: t.DenoFileJson,
): t.DenoFileJson {
  const next = structuredClone(input);
  const workspace = Array.isArray(next.workspace) ? next.workspace : [];
  next.workspace = [...new Set(workspace)].toSorted((a, b) => a.localeCompare(b));
  return next;
}

export async function main(path = './deno.json') {
  const before = (await Fs.readJson<t.DenoFileJson>(path)).data;
  if (!before) throw new Error(`Failed to read workspace deno.json: ${path}`);

  const after = normalizeWorkspace(before);
  const unchanged = Json.stringify(before) === Json.stringify(after);
  if (unchanged) return false;

  await Fs.writeJson(path, after);
  return true;
}

if (import.meta.main) await main();
