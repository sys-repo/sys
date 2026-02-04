import { describe, expect, it } from '../../../-test.ts';
import { type t } from '../common.ts';

export const cdn = {
  envs: ['localhost', 'production'],
  tree: {
    kind: 'group',
    key: 'root',
    children: [
      {
        kind: 'leaf',
        key: 'app',
        values: { localhost: 'http://localhost:4040', production: 'https://example.com' },
      },
      {
        kind: 'group',
        key: 'cdn',
        children: [
          {
            kind: 'leaf',
            key: 'default',
            values: {
              localhost: 'http://localhost:4040',
              production: 'https://cdn.example.com',
            },
          },
          {
            kind: 'leaf',
            key: 'video',
            values: {
              localhost: 'http://localhost:4040',
              production: 'https://video.cdn.example.com',
            },
          },
        ],
      },
    ],
  },
} satisfies t.HttpOriginSpec<t.HttpOriginEnv>;

export const media = {
  envs: ['localhost', 'production'],
  tree: {
    kind: 'group',
    key: 'root',
    children: [
      {
        kind: 'leaf',
        key: 'api',
        values: {
          localhost: 'http://localhost:4040',
          production: 'https://api.example.com',
        },
      },
      {
        kind: 'group',
        key: 'assets',
        children: [
          {
            kind: 'leaf',
            key: 'images',
            values: {
              localhost: 'http://localhost:4041',
              production: 'https://img.example.com',
            },
          },
          {
            kind: 'leaf',
            key: 'video',
            values: {
              localhost: 'http://localhost:4042',
              production: 'https://video.example.com',
            },
          },
        ],
      },
      {
        kind: 'group',
        key: 'stream',
        children: [
          {
            kind: 'leaf',
            key: 'hls',
            values: {
              localhost: ['http://localhost:4043', 'http://localhost:4044'],
              production: ['https://hls-1.example.com', 'https://hls-2.example.com'],
            },
          },
          {
            kind: 'leaf',
            key: 'dash',
            values: {
              localhost: 'http://localhost:4045',
              production: 'https://dash.example.com',
            },
          },
        ],
      },
    ],
  },
} satisfies t.HttpOriginSpec<t.HttpOriginEnv>;
