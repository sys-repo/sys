import { type t } from '../common.ts';

export type MyCdn = {
  app: t.StringUrl;
  cdn: { default: t.StringUrl; video: t.StringUrl };
};

export type MyMedia = {
  api: t.StringUrl;
  assets: { images: t.StringUrl; video: t.StringUrl };
  stream: { hls: t.StringUrl; dash: t.StringUrl };
};

export type SampleName = keyof Samples;
export type Samples = {
  readonly cdn: t.HttpOriginSpecMap<t.HttpOrigin.Env, MyCdn>;
  readonly media: t.HttpOriginSpecMap<t.HttpOrigin.Env, MyMedia>;
};

const cdn: t.HttpOriginSpecMap<t.HttpOrigin.Env, MyCdn> = {
  localhost: {
    app: 'http://localhost:3000',
    cdn: { default: 'http://localhost:4000', video: 'http://localhost:4001' },
  },
  production: {
    app: 'https://app.example.com',
    cdn: { default: 'https://cdn.example.com', video: 'https://video.cdn.example.com' },
  },
};

const media: t.HttpOriginSpecMap<t.HttpOrigin.Env, MyMedia> = {
  localhost: {
    api: 'http://localhost:5000',
    assets: { images: 'http://localhost:5001', video: 'http://localhost:5002' },
    stream: { hls: 'http://localhost:5003', dash: 'http://localhost:5004' },
  },
  production: {
    api: 'https://api.example.com',
    assets: { images: 'https://img.example.com', video: 'https://media.example.com/video' },
    stream: { hls: 'https://hls.example.com', dash: 'https://dash.example.com' },
  },
};

export const Sample: Samples = {
  cdn,
  media,
};
