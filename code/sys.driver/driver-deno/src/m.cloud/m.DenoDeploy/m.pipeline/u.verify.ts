import { type t, c, Cli, Is, Schedule, Str } from './common.ts';

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

const VERIFY_ATTEMPTS = 24;

export async function verifyPreview(url: t.StringUrl) {
  let last: PreviewProbe | undefined;

  for (let i = 0; i < VERIFY_ATTEMPTS; i++) {
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
          if (i < VERIFY_ATTEMPTS - 1) await Schedule.sleep(5000);
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

    if (i < VERIFY_ATTEMPTS - 1) await Schedule.sleep(5000);
  }

  throw new Error(wrangle.failure(url, last));
}

/**
 * Helpers:
 */
const wrangle = {
  errorMessage(error: unknown) {
    return Is.error(error) ? error.message : String(error);
  },

  errorName(error: unknown) {
    return Is.error(error) ? error.name : toTagName(error);
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

function toTagName(input: unknown) {
  return Object.prototype.toString.call(input).slice(8, -1).toLowerCase();
}
