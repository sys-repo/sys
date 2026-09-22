import type { t } from '../common.ts';
import { LIMITS } from '../m.app/u.selection.ts';

/** Structurally valid records only; these pins do not refer to local or remote output. */
export function fixtureInputs(): t.AppInputs {
  const config = fixtureConfig();
  return {
    config,
    buildRecord: {
      publicAssetBase: config.publicAssetBase,
      selection: {
        pins: {
          private: { 'dist.json': `sha256-${'a'.repeat(64)}` },
          public: { 'dist.json': `sha256-${'b'.repeat(64)}` },
        },
      },
    },
  };
}

/** Synthetic names only; no fixture resolves a repository credential. */
export function fixtureConfig() {
  return {
    accountId: '0'.repeat(32),
    targets: {
      private: { bucket: 'sample-private', prefix: 'sample/ui' },
      public: { bucket: 'sample-public', prefix: 'sample/ui' },
    },
    publicAssetBase: 'https://assets.example.test/sample/ui/',
    credentials: {
      serve: {
        accessKeyId: 'FIXTURE_PRIVATE_READ_KEY_ID',
        secretAccessKey: 'FIXTURE_PRIVATE_READ_KEY_SECRET',
      },
      pushPrivate: {
        accessKeyId: 'FIXTURE_PRIVATE_WRITE_KEY_ID',
        secretAccessKey: 'FIXTURE_PRIVATE_WRITE_KEY_SECRET',
      },
      pushPublic: {
        accessKeyId: 'FIXTURE_PUBLIC_WRITE_KEY_ID',
        secretAccessKey: 'FIXTURE_PUBLIC_WRITE_KEY_SECRET',
      },
    },
    limits: LIMITS,
  };
}
