/**
 * @module
 * Test helpers for `@sys/tmpl`.
 */
import type { t } from './common.ts';
import { LocalRepoAuthorities } from './m.LocalRepoAuthorities.ts';
import { LocalRepoFixture } from './m.LocalRepoFixture.ts';

export const TmplTesting: t.TmplTesting.Lib = {
  LocalRepoAuthorities,
  LocalRepoFixture,
};
