import { type t, c, Cli, Fs, Str, expect } from './common.ts';

type PreviewProbe = {
  readonly attempt: number;
  readonly phase: 'preview' | 'asset';
  readonly status?: number;
  readonly contentType?: string;
  readonly body?: string;
  readonly assetUrl?: string;
  readonly assetStatus?: number;
  readonly assetContentType?: string;
  readonly errorName?: string;
  readonly errorMessage?: string;
};

export async function assertPreviewServesBuiltApp(url: t.StringUrl) {
  let last: PreviewProbe | undefined;

  for (let i = 0; i < 24; i++) {
    const attempt = i + 1;

    try {
      const res = await fetch(url);
      const body = await res.text();
      const contentType = res.headers.get('content-type') ?? '';
      const assetUrl = body.match(/src="([^"]+\.js)"/)?.[1];
      let assetStatus: number | undefined;
      let assetContentType: string | undefined;

      if (assetUrl) {
        try {
          const assetRes = await fetch(new URL(assetUrl, url));
          assetStatus = assetRes.status;
          assetContentType = assetRes.headers.get('content-type') ?? '';
          await assetRes.text();
        } catch (error) {
          last = {
            attempt,
            phase: 'asset',
            status: res.status,
            contentType,
            body,
            assetUrl,
            errorMessage: wrangle.errorMessage(error),
            errorName: wrangle.errorName(error),
          };
          if (i < 23) await wait(5000);
          continue;
        }
      }

      last = {
        attempt,
        phase: 'preview',
        status: res.status,
        contentType,
        body,
        assetUrl,
        assetStatus,
        assetContentType,
      };

      const isHtml =
        res.status === 200 &&
        contentType.includes('text/html') &&
        body.trim().length > 0 &&
        (body.includes('<!doctype html') ||
          body.includes('<!DOCTYPE html') ||
          body.includes('<html'));
      const hasScript =
        Boolean(assetUrl) &&
        assetStatus === 200 &&
        (assetContentType?.includes('javascript') ?? false);
      if (isHtml && hasScript) return;
    } catch (error) {
      last = {
        attempt,
        phase: 'preview',
        errorMessage: wrangle.errorMessage(error),
        errorName: wrangle.errorName(error),
      };
    }

    if (i < 23) await wait(5000);
  }

  throw new Error(wrangle.failure(url, last));
}

export async function assertStageUsesGeneratedRootEntry(args: {
  readonly entrypoint: string;
  readonly entryPaths: string;
}) {
  const entry = (await Fs.readText(args.entrypoint)).data ?? '';
  const entryPaths = (await Fs.readText(args.entryPaths)).data ?? '';

  expect(entry).to.include(`import { Fs } from '@sys/fs';`);
  expect(entry).to.include(`import { targetDir } from './entry.paths.ts';`);
  expect(entry).to.include(`const cwd = Fs.Path.fromFileUrl(new URL('.', import.meta.url));`);
  expect(entry).to.include(`export default await DenoEntry.serve({ cwd, targetDir });`);
  expect(entryPaths).to.include(`export const targetDir = './`);
}

async function wait(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

const wrangle = {
  errorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error);
  },

  errorName(error: unknown) {
    return error instanceof Error ? error.name : typeof error;
  },

  failure(url: t.StringUrl, probe?: PreviewProbe) {
    const table = Cli.table([]);
    const row = (label: string, value: string) => table.push([c.gray(label), value]);

    row('preview', url);
    row('phase', probe?.phase ?? 'preview');
    row('attempt', String(probe?.attempt ?? 0));
    row('status', probe?.status ? String(probe.status) : '');
    row('content-type', probe?.contentType ?? '');
    row('asset', probe?.assetUrl ?? '');
    row('asset status', probe?.assetStatus ? String(probe.assetStatus) : '');
    row('asset type', probe?.assetContentType ?? '');
    row('error', probe?.errorName ?? '');
    row('message', probe?.errorMessage ?? '');

    const body = probe?.body?.trim() ?? '';
    return Str.dedent(`
      ${c.brightCyan('Preview Verification Failed')}

      ${table.toString().trimEnd()}
      ${body.length > 0 ? `\n\n${body}` : ''}
    `);
  },
} as const;
