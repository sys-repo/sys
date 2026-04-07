import { type t } from '../common.ts';

export type MyCdn = {
  app: t.StringUrl;
  cdn: { default: t.StringUrl; video: t.StringUrl };
};

export type MyHttpOriginPair = {
  proxy: t.StringUrl;
  cdn: t.StringUrl;
};

export type MyMedia = {
  api: t.StringUrl;
  assets: { images: t.StringUrl; video: t.StringUrl };
  stream: { hls: t.StringUrl; dash: t.StringUrl };
};

export type SampleName = keyof Samples;
export type Samples = {
  readonly cdn: t.HttpOrigin.SpecMap<t.HttpOrigin.Env, MyCdn>;
  readonly 'fs.db.team': t.HttpOrigin.SpecMap<t.HttpOrigin.Env, MyHttpOriginPair>;
  readonly media: t.HttpOrigin.SpecMap<t.HttpOrigin.Env, MyMedia>;
  readonly overflow: t.HttpOrigin.SpecMap<t.HttpOrigin.Env, MyCdn>;
};

const cdn: t.HttpOrigin.SpecMap<t.HttpOrigin.Env, MyCdn> = {
  localhost: {
    app: 'http://localhost:3000',
    cdn: { default: 'http://localhost:4000', video: 'http://localhost:4001' },
  },
  production: {
    app: 'https://app.example.com',
    cdn: { default: 'https://cdn.example.com', video: 'https://video.cdn.example.com' },
  },
};

const media: t.HttpOrigin.SpecMap<t.HttpOrigin.Env, MyMedia> = {
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

const fsdb: t.HttpOrigin.SpecMap<t.HttpOrigin.Env, MyHttpOriginPair> = {
  localhost: {
    proxy: 'http://localhost:3000',
    cdn: 'http://localhost:4000',
  },
  production: {
    proxy: 'https://fs.db.team',
    cdn: 'https://fs.db.team/ui.components',
  },
};

const overflow: t.HttpOrigin.SpecMap<t.HttpOrigin.Env, MyCdn> = {
  localhost: {
    app: 'http://localhost:3000/very/long/path/to/the/local/application/root',
    cdn: {
      default: 'http://localhost:4000/assets/default/bundle/with/a/really/long/prefix',
      video: 'http://localhost:4001/assets/video/bundle/with/a/really/long/prefix',
    },
  },
  production: {
    app: 'https://app.example.com/products/venture-library/overflow-case/root',
    cdn: {
      default: 'https://cdn.example.com/packages/default/with/a/really/long/asset/root',
      video: 'https://video.cdn.example.com/packages/video/with/a/really/long/asset/root',
    },
  },
};

export const Sample: Samples = {
  cdn,
  'fs.db.team': fsdb,
  media,
  overflow,
};
