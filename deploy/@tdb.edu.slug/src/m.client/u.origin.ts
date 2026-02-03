import { type t, Is, Url } from './common.ts';

export function parseOrigin(input: t.StringUrl | t.SlugClientOrigin) {
  if (Is.str(input)) {
    const base = Url.normalize(input);
    return {
      app: base,
      cdn: { default: base, video: base },
    };
  }

  const obj = input;
  const app = Url.normalize(obj.app);
  const cdnDefault = Url.normalize(obj.cdn.default || app);
  const cdnVideo = Url.normalize(obj.cdn.video || cdnDefault);
  return {
    app: app || cdnDefault || cdnVideo,
    cdn: {
      default: cdnDefault || app || cdnVideo,
      video: cdnVideo || cdnDefault || app,
    },
  };
}
