import { Is, Str, type t } from './common.ts';

export const ReverseProxyResolver: t.ReverseProxy.ResolverFactory = (config) => {
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
      } satisfies t.ReverseProxy.ResolveMountResult;
    }

    if (root) {
      return {
        kind: 'root',
        upstream: joinUpstream(root.upstream, pathname.slice(1)),
      } satisfies t.ReverseProxy.ResolveRootResult;
    }

    return { kind: 'none' } satisfies t.ReverseProxy.ResolveNoneResult;
  };
};

/**
 * Helpers:
 */

function normalizeConfig(config: t.ReverseProxy.Config): t.ReverseProxy.Config {
  const root = config.root ? normalizeRoot(config.root) : undefined;
  const mounts = normalizeMounts(config.mounts);
  return {
    root,
    mounts,
  } satisfies t.ReverseProxy.Config;
}

function normalizeRoot(root: t.ReverseProxy.RootTarget): t.ReverseProxy.RootTarget {
  validateUpstream(root.upstream, 'root.upstream');
  return { upstream: root.upstream } satisfies t.ReverseProxy.RootTarget;
}

function normalizeMounts(
  mounts: t.ReverseProxy.Config['mounts'],
): readonly t.ReverseProxy.Mount[] | undefined {
  if (!mounts || mounts.length === 0) return undefined;

  const seen = new Set<string>();
  const normalized = mounts.map((mount) => {
    validateMountPath(mount.mountPath);
    validateUpstream(mount.upstream, `mount[${mount.mountPath}].upstream`);

    if (seen.has(mount.mountPath)) {
      throw new Error(`ReverseProxyResolver: duplicate mountPath: ${mount.mountPath}`);
    }

    seen.add(mount.mountPath);

    return {
      mountPath: mount.mountPath,
      upstream: mount.upstream,
    } satisfies t.ReverseProxy.Mount;
  });

  return [...normalized].sort((a, b) => b.mountPath.length - a.mountPath.length);
}

function validatePathname(pathname: t.StringUrlRoute): void {
  if (!Is.str(pathname) || pathname.length === 0 || !pathname.startsWith('/')) {
    throw new Error(`ReverseProxyResolver: pathname must start with '/': ${String(pathname)}`);
  }
}

function validateMountPath(path: t.StringUrlRoute): void {
  if (!Is.str(path) || path.length === 0) {
    throw new Error('ReverseProxyResolver: mountPath must be a non-empty string');
  }

  if (!path.startsWith('/') || !path.endsWith('/')) {
    throw new Error(`ReverseProxyResolver: mountPath must start and end with '/': ${path}`);
  }

  if (path === '/') {
    throw new Error(`ReverseProxyResolver: mountPath '/' is invalid; use root.upstream instead`);
  }
}

function validateUpstream(upstream: t.StringUrl, label: string): void {
  if (!Is.urlString(upstream)) {
    throw new Error(`ReverseProxyResolver: ${label} must be a valid http(s) URL: ${upstream}`);
  }

  const url = new URL(upstream);

  if (url.search.length > 0 || url.hash.length > 0) {
    throw new Error(`ReverseProxyResolver: ${label} must not include query or hash: ${upstream}`);
  }

  if (!url.pathname.endsWith('/')) {
    throw new Error(`ReverseProxyResolver: ${label} must end with '/': ${upstream}`);
  }
}

function resolveRedirect(
  pathname: t.StringUrlRoute,
  mounts: readonly t.ReverseProxy.Mount[],
): t.ReverseProxy.ResolveRedirectResult | undefined {
  for (const mount of mounts) {
    const trimmed = mount.mountPath.slice(0, -1) as t.StringUrlRoute;
    if (pathname !== trimmed) continue;
    return {
      kind: 'redirect',
      location: mount.mountPath,
    } satisfies t.ReverseProxy.ResolveRedirectResult;
  }

  return undefined;
}

function joinUpstream(base: t.StringUrl, suffix: string): t.StringUrl {
  const relative = Str.trimLeadingSlashes(suffix);
  return new URL(relative || '.', base).href as t.StringUrl;
}
