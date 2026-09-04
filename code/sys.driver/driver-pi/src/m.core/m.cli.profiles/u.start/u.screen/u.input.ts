import { Cli, Fs, Is, type t } from '../common.ts';

import { createOwnedError } from '../u.error.ts';
import { captureFileHref, captureUrl, stableNativeUrl } from '../u.url.ts';
import type { CapturedRootLink, RootLinkInput, ScreenSize } from './t.ts';

const MAX_SCREEN_DIMENSION = 65_535;

/** Capture one development root and its file-link authority. */
export function captureRootLink(input: unknown): CapturedRootLink | undefined {
  const text = captureDisplayRoot(input);
  if (!text) return;
  const href = captureFileHref(text);
  const url = href ? stableNativeUrl(href) : undefined;
  return url ? Object.freeze({ text, url }) : undefined;
}

/** Return an already captured root, or capture a raw root at this internal boundary. */
export function capturedRootLink(input: RootLinkInput | undefined): CapturedRootLink | undefined {
  return Is.string(input) ? captureRootLink(input) : input;
}

/** Admit one credential-free HTTP(S) manifest URL. */
export function captureManifestUrl(input: unknown): t.StringUrl | undefined {
  if (!Is.string(input)) return;
  const url = captureUrl(input);
  if (
    !url || (url.protocol !== 'http:' && url.protocol !== 'https:') ||
    url.username || url.password || url.search || url.hash
  ) return;
  return url.href;
}

/** Capture one service URL into terminal presentation parts. */
export function captureServiceUrl(input: t.StringUrl): t.Cli.Fmt.ServiceUrl.Part | undefined {
  const url = captureUrl(input);
  if (!url) return;
  const hostname = Cli.Fmt.ServiceUrl.displayHostname(url.hostname);
  const host = url.port ? `${hostname}:${url.port}` : hostname;
  const origin = `${url.protocol}//${host}`;
  const suffix = `${url.pathname}${url.search}${url.hash}` || '/';
  return Object.freeze({
    ok: true,
    href: url.href,
    origin,
    suffix,
    display: `${origin}${suffix}`,
    ...(url.port ? { port: url.port } : {}),
    highlightOrigin: true,
  });
}

/** Normalize one viewport snapshot for bounded terminal rendering. */
export function normalizeSize(size: unknown): ScreenSize {
  if (!Cli.Fmt.isReady()) {
    throw createOwnedError('start:gui screen presentation authority unavailable.');
  }
  if (!Is.object(size)) throw createOwnedError('start:gui screen failed.');
  const candidate = size as Partial<ScreenSize>;
  if (!isScreenDimension(candidate.width) || !isScreenDimension(candidate.height)) {
    throw createOwnedError('start:gui screen failed.');
  }
  return Object.freeze({
    width: candidate.width === 0 ? 0 : candidate.width,
    height: candidate.height === 0 ? 0 : candidate.height,
  });
}

/** Read the post-resize viewport from one size-change event. */
export function snapshotResizeAfter(event: unknown): unknown {
  if (!Is.object(event)) return;
  const candidate = event as Partial<t.Cli.Screen.SizeChanged>;
  return candidate.kind === 'size:changed' ? candidate.after : undefined;
}

export function numericMax(left: number, right: number): number {
  return Math.max(left, right);
}

function captureDisplayRoot(input: unknown): t.StringAbsoluteDir | undefined {
  if (!Is.string(input) || input.trim() !== input || !Fs.Path.Is.absolute(input)) return;
  for (let index = 0; index < input.length; index += 1) {
    const code = input.codePointAt(index);
    if (code === undefined || code <= 0x1f || (code >= 0x7f && code <= 0x9f)) return;
    if (code > 0xffff) index += 1;
  }
  return input as t.StringAbsoluteDir;
}

function isScreenDimension(input: unknown): input is number {
  return Is.number(input) && Number.isFinite(input) && Number.isInteger(input) && input >= 0 &&
    input <= MAX_SCREEN_DIMENSION;
}
