import { DEFAULTS, Obj, type t } from '../common.ts';
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

  moduleId(namespace: string) {
    return Obj.hash(namespace).toString(36);
  },

  async module(url: URL, specs: t.SpecImports) {
    const params = url.searchParams;
    if (!params.has(QS.dev)) return undefined;

    const field = params.get(QS.dev) ?? '';
    const matches = DevUrl.moduleMatches(field, specs);
    if (matches.length > 1) {
      console.warn(`DevHarness module ID "${field}" is ambiguous`);
      return undefined;
    }

    const match = matches[0];
    if (match) {
      const res = await match.fn();
      if (typeof res !== 'object') return undefined;
      if (res.default?.kind === 'TestSuite') return res.default;
      console.warn(`Imported default from field "${field}" is not of kind "TestSuite"`);
    }

    return undefined;
  },

  moduleMatches(field: string, specs: t.SpecImports) {
    if (!field) return [];

    const keys = Object.keys(specs);
    const exact = keys.find((key) => key === field);
    const matches = exact ? [exact] : keys.filter((key) => DevUrl.moduleId(key) === field);

    return matches
      .map((namespace) => ({ namespace, fn: (specs as any)[namespace] }))
      .filter(({ fn }) => typeof fn === 'function');
  },
};

export const DevArgs: DevArgsLib = {
  Url: DevUrl,
  Params: DevUrlParams,
};
