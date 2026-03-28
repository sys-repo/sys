import { Fs } from './common.ts';

export async function snapshotPackageDenoJson() {
  const path = Fs.Path.fromFileUrl(new URL('../../../../deno.json', import.meta.url));
  const text = (await Fs.readText(path)).data ?? '';
  return { path, text } as const;
}

export async function restorePackageDenoJsonIfPolluted(snapshot: { readonly path: string; readonly text: string }) {
  const current = (await Fs.readText(snapshot.path)).data ?? '';
  if (current === snapshot.text) return;
  await Fs.write(snapshot.path, snapshot.text);
}
