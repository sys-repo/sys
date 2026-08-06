import { D, Path, type t } from '../common.ts';
import { Fs } from '@sys/fs';

export type EndpointRefKind = 'service' | 'task';
export type EndpointRefSource = 'local' | 'trusted';
export type EndpointRefAuthority = 'relative' | 'bare' | 'jsr';

export type EndpointRef = {
  /** Descriptor-authored module ref, preserved for review/error reporting. */
  readonly from: string;
  /** Package identity used for trust checks. */
  readonly identity: string;
  /** Concrete import specifier selected for this runtime. */
  readonly specifier: string;
  /** How Cell accepted the ref. */
  readonly source: EndpointRefSource;
  /** Authored ref authority class. */
  readonly authority: EndpointRefAuthority;
};

export type EndpointRefResolver = (specifier: string) => string;

export type ResolveEndpointRefOptions = {
  readonly root: t.StringDir;
  readonly from: string;
  readonly name: t.Cell.Id;
  readonly kind: EndpointRefKind;
  readonly context: string;
  readonly trusted?: readonly string[];
  readonly resolve?: EndpointRefResolver;
};

/**
 * Resolve the named endpoint selected by a task/service descriptor.
 */
export function endpointNameOf(ref: t.Cell.EndpointSelector): string {
  return ref.use;
}

export function resolveEndpointRef(options: ResolveEndpointRefOptions): EndpointRef {
  const { context, kind, name, root } = options;
  const from = options.from.trim();

  if (Path.Is.absolute(from)) {
    throw new Error(`${context}: absolute ${kind} import for '${name}' is not allowed: ${from}`);
  }

  if (isRelativeSpecifier(from)) {
    return {
      from: options.from,
      identity: from,
      specifier: resolveLocalImportSpecifier({ context, from, kind, name, root }),
      source: 'local',
      authority: 'relative',
    };
  }

  const identity = trustIdentityOf(from);
  const trusted = options.trusted ?? D.trusted;
  const ok = trusted.some((prefix) => identity.startsWith(prefix));
  if (!ok) throw new Error(`${context}: untrusted ${kind} import for '${name}': ${from}`);

  return {
    from: options.from,
    identity,
    specifier: resolveTrustedImportSpecifier({ ...options, from }),
    source: 'trusted',
    authority: authorityOf(from),
  };
}

export function trustIdentityOf(from: string): string {
  return from.startsWith('jsr:') ? from.slice('jsr:'.length) : from;
}

/**
 * Helpers:
 */
function resolveTrustedImportSpecifier(
  options: Omit<ResolveEndpointRefOptions, 'from'> & { readonly from: string },
): string {
  const resolve = options.resolve ?? ((specifier: string) => import.meta.resolve(specifier));

  try {
    return resolve(options.from);
  } catch (cause) {
    throw new Error(
      `${options.context}: failed to resolve ${options.kind} import for '${options.name}': ${options.from}. Use explicit 'jsr:' refs for portable descriptors.`,
      { cause },
    );
  }
}

function resolveLocalImportSpecifier(options: {
  readonly root: t.StringDir;
  readonly from: string;
  readonly name: t.Cell.Id;
  readonly kind: EndpointRefKind;
  readonly context: string;
}): string {
  const root = Path.resolve(options.root, '.');
  const path = Path.resolve(root, options.from);

  if (!Path.Is.within(root, path)) {
    throw new Error(
      `${options.context}: local ${options.kind} import for '${options.name}' escapes Cell root: ${options.from}`,
    );
  }

  return String(Fs.Path.toFileUrl(path));
}

function authorityOf(from: string): EndpointRefAuthority {
  return from.startsWith('jsr:') ? 'jsr' : 'bare';
}

function isRelativeSpecifier(value: string) {
  return value.startsWith('./') || value.startsWith('../');
}
