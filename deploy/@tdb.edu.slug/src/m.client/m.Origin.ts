import { type t, Is, Url } from './common.ts';

export const paths: t.SlugLoaderOrigin = {
  app: 'staging/slc',
  cdn: {
    default: 'staging/slc.cdn',
    video: 'staging/slc.cdn.video',
  },
};

export const Origin: t.SlugLoaderLib['Origin'] = {
  paths,
  parse,
};

export function parse(input: t.StringUrl | t.SlugLoaderOrigin): t.SlugLoaderOrigin {
  if (Is.object(input)) return input;

  console.log('input', input);
  console.trace();

  if (Is.localhost(input)) {
    return {
      app: normalize(input, paths.app),
      cdn: {
        default: normalize(input, paths.cdn.default),
        video: normalize(input, paths.cdn.video),
      },
    };
  }

  return {
    app: normalize(hostname('', input)),
    cdn: {
      default: normalize(hostname('cdn', input)),
      video: normalize(hostname('video.cdn', input)),
    },
  };
}

/**
 * Helpers
 */
function normalize(input: t.StringUrl, path: t.StringPath = '') {
  return Url.parse(Url.normalize(input)).join(path);
}

export function hostname(subdomain: string, base: string) {
  const sub = String(subdomain ?? '').trim();
  const raw = String(base ?? '').trim();
  if (!raw) return '';

  const parsed = Url.parse(Url.normalize(raw));
  if (parsed.ok) {
    const url = parsed.toURL();
    const host = sub ? `${sub}.${url.hostname}` : url.hostname;
    return `${url.protocol}//${host}`;
  }

  return sub ? `${sub}.${raw}` : raw;
}
