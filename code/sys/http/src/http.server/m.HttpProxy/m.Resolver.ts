import { Is, Str, type t } from './common.ts';

export const HttpProxyResolver: t.HttpProxy.ResolverFactory = (config) => {
  const normalized = normalizeConfig(config);
  const mounts = normalized.mounts ?? [];
  const root = normalized.root;

  return (pathname) => {
    validatePathname(pathname);

    const redirect = resolveRedirect(pathname, mounts);
    if (redirect) return redirect;

    for (const mount of mounts) {
      if (!pathname.startsWith(mount.mountPath)) continue;
      return {
        kind: 'mount',
        upstream: joinUpstream(mount.upstream, pathname.slice(mount.mountPath.length)),
        ...withResponseConfig(mount.response),
      } satisfies t.HttpProxy.ResolveMountResult;
    }

    if (root) {
      return {
        kind: 'root',
        upstream: joinUpstream(root.upstream, pathname.slice(1)),
        ...withResponseConfig(root.response),
      } satisfies t.HttpProxy.ResolveRootResult;
    }

    return { kind: 'none' } satisfies t.HttpProxy.ResolveNoneResult;
  };
};

/**
 * Helpers:
 */

function normalizeConfig(config: t.HttpProxy.Config): t.HttpProxy.Config {
  const root = config.root ? normalizeRoot(config.root) : undefined;
  const mounts = normalizeMounts(config.mounts);
  return {
    root,
    mounts,
  } satisfies t.HttpProxy.Config;
}

function normalizeRoot(root: t.HttpProxy.RootTarget): t.HttpProxy.RootTarget {
  validateUpstream(root.upstream, 'root.upstream');
  return {
    upstream: root.upstream,
    response: root.response,
  } satisfies t.HttpProxy.RootTarget;
}

function normalizeMounts(
  mounts: t.HttpProxy.Config['mounts'],
): readonly t.HttpProxy.Mount[] | undefined {
  if (!mounts || mounts.length === 0) return undefined;

  const seen = new Set<string>();
  const normalized = mounts.map((mount) => {
    validateMountPath(mount.mountPath);
    validateUpstream(mount.upstream, `mount[${mount.mountPath}].upstream`);

    if (seen.has(mount.mountPath)) {
      throw new Error(`HttpProxyResolver: duplicate mountPath: ${mount.mountPath}`);
    }

    seen.add(mount.mountPath);

    return {
      mountPath: mount.mountPath,
      upstream: mount.upstream,
      response: mount.response,
    } satisfies t.HttpProxy.Mount;
  });

  return [...normalized].sort((a, b) => b.mountPath.length - a.mountPath.length);
}

function validatePathname(pathname: t.StringUrlRoute): void {
  if (!Is.str(pathname) || pathname.length === 0 || !pathname.startsWith('/')) {
    throw new Error(`HttpProxyResolver: pathname must start with '/': ${String(pathname)}`);
  }
}

function validateMountPath(path: t.StringUrlRoute): void {
  if (!Is.str(path) || path.length === 0) {
    throw new Error('HttpProxyResolver: mountPath must be a non-empty string');
  }

  if (!path.startsWith('/') || !path.endsWith('/')) {
    throw new Error(`HttpProxyResolver: mountPath must start and end with '/': ${path}`);
  }

  if (path === '/') {
    throw new Error(`HttpProxyResolver: mountPath '/' is invalid; use root.upstream instead`);
  }
}

function validateUpstream(upstream: t.StringUrl, label: string): void {
  if (!Is.urlString(upstream)) {
    throw new Error(`HttpProxyResolver: ${label} must be a valid http(s) URL: ${upstream}`);
  }

  const url = new URL(upstream);

  if (url.search.length > 0 || url.hash.length > 0) {
    throw new Error(`HttpProxyResolver: ${label} must not include query or hash: ${upstream}`);
  }

  if (!url.pathname.endsWith('/')) {
    throw new Error(`HttpProxyResolver: ${label} must end with '/': ${upstream}`);
  }
}

function resolveRedirect(
  pathname: t.StringUrlRoute,
  mounts: readonly t.HttpProxy.Mount[],
): t.HttpProxy.ResolveRedirectResult | undefined {
  for (const mount of mounts) {
    const trimmed = mount.mountPath.slice(0, -1) as t.StringUrlRoute;
    if (pathname !== trimmed) continue;
    return {
      kind: 'redirect',
      location: mount.mountPath,
    } satisfies t.HttpProxy.ResolveRedirectResult;
  }

  return undefined;
}

function joinUpstream(base: t.StringUrl, suffix: string): t.StringUrl {
  const relative = Str.trimLeadingSlashes(suffix);
  return new URL(relative || '.', base).href as t.StringUrl;
}

function withResponseConfig(
  response?: t.HttpProxy.ResponseHeadersConfig,
): Partial<Pick<t.HttpProxy.ResolveMountResult, 'response'>> {
  return response ? { response } : {};
}
