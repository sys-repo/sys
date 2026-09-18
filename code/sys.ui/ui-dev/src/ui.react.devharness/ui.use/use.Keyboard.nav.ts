import { Is } from './common.ts';

type DevNavRoute = {
  readonly kind: 'root' | 'index' | 'spec';
  readonly url: URL;
  readonly query: URLSearchParams;
};

/** DevHarness keyboard route policy. */
export const KeyboardNav = {
  create,
} as const;

function create() {
  return {
    openIndex() {
      const route = getRoute();
      if (route.kind === 'root') navigateToIndex(route);
    },
    up() {
      const route = getRoute();
      if (route.kind === 'index') navigateToRoot(route);
      else if (route.kind === 'spec') navigateToIndex(route);
    },
  } as const;
}

function getRoute(): DevNavRoute {
  const url = new URL(window.location.href);
  const query = url.searchParams;
  const hasDev = query.has('dev');
  const hasAlias = query.has('d');
  if (!hasDev && !hasAlias) return { kind: 'root', url, query };

  const value = hasDev ? query.get('dev') : query.get('d');
  const kind = isIndexValue(value) ? 'index' : 'spec';
  return { kind, url, query };
}

function isIndexValue(value: string | null) {
  return Is.nil(value) || value === '' || value === 'true';
}

function navigateToIndex(route: DevNavRoute) {
  route.query.delete('d');
  route.query.set('dev', 'true');
  window.location.href = route.url.href;
}

function navigateToRoot(route: DevNavRoute) {
  route.query.delete('d');
  route.query.delete('dev');
  window.location.href = route.url.href;
}
