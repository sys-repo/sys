import { type t, Url } from '../common.ts';
import { encodeHyperlink, hyperlinkCodeUnits } from '../u/u.hyperlink.ts';
import { composeServiceText, fitServiceText, serviceFragment } from './u.layout.ts';
import { parts, type ServiceUrlAdmission } from './u.url.prepare.ts';

type Admission = { readonly href: string; readonly target?: URL; readonly valid: boolean };
type ServiceUrlValue = {
  readonly part: t.CliFormat.ServiceUrl.Part;
  readonly target?: URL;
  readonly valid: boolean;
};

/**
 * Prepare one service's URLs for display, preserving their original link targets.
 * Highlight each origin's first appearance within this service, not across the full service list.
 */
export function serviceUrlValues(
  urls: readonly t.Service.Url[],
  options: t.CliFormat.ServiceUrl.Parts.Options = {},
  admission?: ServiceUrlAdmission,
): readonly ServiceUrlValue[] {
  const admitted = urls.map(admit);
  const prepared = parts(admitted.map(({ href }) => ({ href })), options, admission);
  return prepared.map((part, index) => ({ part, ...admitted[index] }));
}

/**
 * Fit a URL label to the available width and optionally link it to the original address.
 * Invalid URLs show `invalid URL`; empty and ellipsis-only labels are not linked.
 * Admit the encoded link against the row's remaining budget before composing it.
 */
export function serviceUrlValue(
  value: ServiceUrlValue,
  width: number | undefined,
  links: boolean,
  check: (length: number, hasSource: boolean) => void,
  link = encodeHyperlink,
  compose = composeServiceText,
) {
  if (!value.valid) {
    const text = fitServiceText('invalid URL', width, {
      check: (length) => check(length, false),
      compose,
      color: 'yellow',
    });
    return { text, hasSource: false };
  }
  const { part, target } = value;
  let hasSource = false;
  const label = fitServiceText(part.display, width, {
    check(length, _cells, retained) {
      hasSource = retained;
      check(length, retained);
    },
    compose,
    fragments: (text, offset) => fragment(part, text, offset),
  });
  if (!links || !target || !hasSource) return { text: label, hasSource };
  const href = target.href;
  check(hyperlinkCodeUnits(label, href), hasSource);
  return { text: link(label, href), hasSource };
}

/**
 * Helpers:
 */
function admit(url: t.Service.Url): Admission {
  const href = url.href;
  for (const character of href) {
    const code = character.charCodeAt(0);
    if (code <= 0x1f || (code >= 0x7f && code <= 0x9f)) return { href: '', valid: false };
  }
  const parsed = Url.parse(href);
  if (!parsed.ok) return { href: '', valid: false };
  const target = parsed.toURL();
  if (target.username || target.password) return { href: '', valid: false };
  const protocol = target.protocol;
  const link = protocol === 'http:' || protocol === 'https:' || protocol === 'ws:' ||
    protocol === 'wss:';
  return { href, valid: true, ...(link ? { target } : {}) };
}

function fragment(part: t.CliFormat.ServiceUrl.Part, text: string, offset: number) {
  const originEnd = part.origin.length;
  const portStart = part.highlightOrigin && part.port ? originEnd - part.port.length : originEnd;
  const origin = part.highlightOrigin ? 'cyan' : 'gray';
  const port = part.highlightOrigin ? 'port' : 'gray';
  const suffix = part.highlightOrigin && part.suffix === '/' ? 'cyan' : 'gray';
  return [
    ...serviceFragment(text, offset, 0, portStart, origin),
    ...serviceFragment(text, offset, portStart, originEnd, port),
    ...serviceFragment(text, offset, originEnd, part.display.length, suffix),
  ];
}
