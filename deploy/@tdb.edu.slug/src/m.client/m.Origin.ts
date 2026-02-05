import { type t, Is, Url } from './common.ts';

export const Origin: t.SlugLoaderLib['Origin'] = {
  parse,
};

export function parse(input: t.StringUrl | t.SlugLoaderOrigin): t.SlugLoaderOrigin {
  if (Is.object(input)) return input;

  if (Is.localhost(input)) {
    return {
      app: normalize(input, 'staging/slc'),
      cdn: {
        default: normalize(input, 'staging/slc.cdn'),
        video: normalize(input, 'staging/slc.cdn.video'),
      },
    };
  }

  return {
    app: normalize(input),
    cdn: {
      default: normalize(input),
      video: normalize(input),
    },
  };
}

/**
 * Helpers
 */
function normalize(input: t.StringUrl, path: t.StringPath = '') {
  return Url.parse(Url.normalize(input)).join(path);
}
