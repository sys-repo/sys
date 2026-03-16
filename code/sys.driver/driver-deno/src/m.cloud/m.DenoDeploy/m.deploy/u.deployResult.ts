import { type t, Is } from './common.ts';

type DeployMeta = {
  readonly revisionUrl?: string;
  readonly previewUrl?: string;
};

export function toDeployMeta(input: { readonly stdout: string; readonly stderr: string }) {
  const text = `${input.stdout}\n${input.stderr}`;
  const urls = text.match(/https?:\/\/[^\s]+/g) ?? [];
  const revisionUrl = urls.find((url) => url.includes('console.deno.com/'));
  const previewUrl = urls.find((url) => url.includes('.deno.net'));

  if (!Is.str(revisionUrl) && !Is.str(previewUrl)) return undefined;
  return {
    ...(Is.str(revisionUrl) ? { revisionUrl } : {}),
    ...(Is.str(previewUrl) ? { previewUrl } : {}),
  } satisfies DeployMeta;
}
