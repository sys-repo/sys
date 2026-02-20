import { isValidElement } from 'react';
import { type t, Is, Str, Url } from './common.ts';
import { toEllipsis } from './u.ts';

type Side = 'k' | 'v';
type Def = t.KeyValueLinkDef;
type DefInput = t.KeyValueHref | undefined;

export type ResolvedHref = {
  href: t.StringUri;
  target?: '_blank';
  rel?: string;
};

export function isAnchorElement(node?: t.ReactNode): boolean {
  return isValidElement(node) && Is.str(node.type) ? node.type === 'a' : false;
}

export function toAnchorStyle(args: { truncate?: boolean; textChild?: boolean }): t.CssProps {
  const { truncate, textChild } = args;
  if (!(truncate && textChild)) {
    return {
      color: 'inherit',
      textDecoration: 'underline',
    };
  }

  return {
    color: 'inherit',
    textDecoration: 'underline',
    display: 'block',
    minWidth: 0,
    ...toEllipsis(true),
  };
}

export function resolveHref(input: {
  href?: DefInput;
  side: Side;
  children?: t.ReactNode;
}): ResolvedHref | undefined {
  const def = toSideDef(input.href, input.side);
  if (def == null || def === false) return;

  const normalized = normalizeDef(def, input.children);
  if (!normalized) return;
  if (!isSafeHref(normalized.href)) return;

  const open = normalized.open ?? 'new-tab';
  if (open === 'inline') {
    return {
      href: normalized.href,
      rel: normalized.rel,
    };
  }

  return {
    href: normalized.href,
    target: '_blank',
    rel: mergeRel(normalized.rel, 'noopener noreferrer'),
  };
}

/**
 * Helpers:
 */
function toSideDef(input: DefInput, side: Side): Def | undefined {
  if (input == null) return;
  if (isSplitInput(input)) return input[side];
  return side === 'v' ? input : undefined;
}

function isSplitInput(input: t.KeyValueHref): input is { readonly k?: Def; readonly v?: Def } {
  if (!Is.object(input) || Is.array(input)) return false;
  return 'k' in input || 'v' in input;
}

function normalizeDef(def: Def, children?: t.ReactNode): t.KeyValueLinkProps | undefined {
  if (def === false) return;
  if (def === true) return inferDef(children, { infer: true });
  if (Is.string(def)) return { href: def };
  return inferDef(children, def);
}

function inferDef(
  children: t.ReactNode,
  def: t.KeyValueLinkProps,
): t.KeyValueLinkProps | undefined {
  if (def.href) return def;
  if (!def.infer) return;

  const inferred = inferHref(children);
  if (!inferred) return;
  return { ...def, href: inferred };
}

function inferHref(children?: t.ReactNode): t.StringUri | undefined {
  if (Is.string(children) || Is.number(children)) {
    const text = Str.trimEdgeNewlines(String(children)).trim();
    return isSafeHref(text) ? text : undefined;
  }
  return;
}

/**
 * Safe link policy:
 * - Allow common web schemes only.
 * - Allow relative/hash routes.
 * - Reject script/data/blob/file and protocol-relative links.
 */
export function isSafeHref(input?: string): input is t.StringUri {
  if (!input) return false;
  const href = Str.trimEdgeNewlines(input).trim();
  if (!href) return false;

  if (href.startsWith('//')) return false;
  if (href.startsWith('#')) return true;
  if (href.startsWith('/')) return true;
  if (href.startsWith('./') || href.startsWith('../')) return true;

  const lower = href.toLowerCase();
  if (lower.startsWith('mailto:') || lower.startsWith('tel:')) return true;

  const parsed = Url.parse(href);
  if (!parsed.ok) return false;

  const protocol = parsed.toURL().protocol.toLowerCase();
  return protocol === 'http:' || protocol === 'https:';
}

function mergeRel(left?: string, right?: string): string | undefined {
  const values = `${left ?? ''} ${right ?? ''}`.trim().split(/\s+/).filter(Boolean);

  if (values.length === 0) return;
  return [...new Set(values)].join(' ');
}
