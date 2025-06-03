import { type t, DEFAULTS } from '../common.ts';
import type { DevArgsLib, DevUrlLib, DevUrlParamsLib } from './t.ts';

const QS = DEFAULTS.qs;

export const DevUrlParams: DevUrlParamsLib = {
  isDev(location?: t.UrlInput) {
    const params = DevUrl.location(location).searchParams;
    return params.has(QS.d) || params.has(QS.dev);
  },

  formatDevFlag(
    options: { location?: t.UrlInput; defaultNamespace?: string; forceDev?: boolean } = {},
  ) {
    const { defaultNamespace, forceDev } = options;
    const url = DevUrl.location(options.location);
    const params = url.searchParams;

    const updateParams = () => {
      if (!options.location) {
        const diff = globalThis.location.search !== `?${params.toString()}`;
        if (diff) globalThis.location.search = params.toString();
      }
    };

    if (params.has(QS.d)) {
      const value = params.get(QS.d) || defaultNamespace || 'true';
      params.delete(QS.d);
      params.set(QS.dev, value);
      updateParams();
    }

    if (forceDev) {
      if (!params.has(QS.dev)) {
        params.set(QS.dev, defaultNamespace || 'true');
        updateParams();
      }
    }

    return url;
  },

  ensureDevFlag(options: { location?: t.UrlInput } = {}) {
    const url = DevUrl.location(options.location);
    const params = url.searchParams;
    params.delete(DEFAULTS.qs.d);
    params.delete(DEFAULTS.qs.dev);
    params.set(DEFAULTS.qs.dev, 'true');
    if (!options.location) {
      globalThis.location.search = params.toString();
    }
    return url;
  },
};

export const DevUrl: DevUrlLib = {
  navigate: DevUrlParams,

  location(value?: t.UrlInput): URL {
    if (!value) return new URL(globalThis.location.href);
    return typeof value === 'string' ? new URL(value) : new URL(value.href);
  },

  async module(url: URL, specs: t.SpecImports) {
    const params = url.searchParams;
    if (!params.has(QS.dev)) return undefined;

    const namespace = params.get(QS.dev) ?? '';
    const matches = DevUrl.moduleMatches(namespace, specs);

    if (matches[0]) {
      const res = await matches[0].fn();
      if (typeof res !== 'object') return undefined;
      if (res.default?.kind === 'TestSuite') return res.default;
      console.warn(`Imported default from field "${namespace}" is not of kind "TestSuite"`);
    }

    return undefined;
  },

  moduleMatches(field: string, specs: t.SpecImports) {
    if (!field) return [];
    return Object.keys(specs)
      .filter((key) => key === field)
      .map((namespace) => ({ namespace, fn: (specs as any)[namespace] }))
      .filter(({ fn }) => typeof fn === 'function');
  },
};

export const DevArgs: DevArgsLib = {
  Url: DevUrl,
  Params: DevUrlParams,
};
