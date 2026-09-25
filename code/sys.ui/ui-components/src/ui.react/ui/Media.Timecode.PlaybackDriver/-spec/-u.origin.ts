import { type t, Is } from './common.ts';

const DEFAULT_ENV = Is.localhost() ? 'localhost' : 'production';

export const ORIGIN = {
  DEFAULT_ENV,
  SPEC: {
    localhost: {
      app: 'http://localhost:4040/staging/slc.cdn/program',
      cdn: {
        default: 'http://localhost:4040/staging/slc.cdn',
        video: 'http://localhost:4040/staging/slc.cdn.video',
      },
    },
    production: {
      app: 'https://cdn.slc.db.team/program',
      cdn: {
        default: 'https://cdn.slc.db.team',
        video: 'https://video.cdn.slc.db.team',
      },
    },
  },
} as const;

export type OriginEnv = keyof typeof ORIGIN.SPEC;
export type OriginUrls = {
  readonly app: t.StringUrl;
  readonly default: t.StringUrl;
  readonly video: t.StringUrl;
};

export function resolveOriginUrls(env?: OriginEnv): OriginUrls {
  const key = env ?? ORIGIN.DEFAULT_ENV;
  const spec = ORIGIN.SPEC[key] ?? ORIGIN.SPEC[ORIGIN.DEFAULT_ENV];
  return {
    app: spec.app,
    default: spec.cdn.default,
    video: spec.cdn.video,
  };
}

/**
 * Descriptor-compatible layout policy for timeline asset URL rewriting.
 */
export const SHARD_LAYOUT = {
  manifestsDir: '-manifests',
  shard: {
    video: {
      strategy: 'prefix-range',
      total: 64,
      host: 'prefix-shard',
      path: 'root-filename',
    },
  },
} as const;
