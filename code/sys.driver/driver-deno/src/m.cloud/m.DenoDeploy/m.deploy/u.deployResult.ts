import { type t, Is } from './common.ts';

export function toDeployMeta(input: { readonly stdout: string; readonly stderr: string }) {
  const text = `${input.stdout}\n${input.stderr}`;
  const urls = text.match(/https?:\/\/[^\s]+/g) ?? [];
  const revisionUrl = urls.find((url) => url.includes('console.deno.com/'));
  const previewUrl = urls.find((url) => url.includes('.deno.net'));

  if (!Is.str(revisionUrl) || !Is.str(previewUrl)) return undefined;
  return {
    url: {
      revision: revisionUrl,
      preview: previewUrl,
    },
  } satisfies t.DenoDeploy.Deploy.Info;
}
