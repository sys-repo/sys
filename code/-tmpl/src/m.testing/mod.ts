/**
 * @module
 * Test helpers for `@sys/tmpl`.
 *
 * Design note:
 * - Keep `LocalRepoAuthorities.rewrite(...)` deterministic and central.
 * - Let callers shape fixtures freely, then re-run rewrite.
 * - Add scenario tests before widening behavior or convenience APIs.
 * - Preserve repo-root `deno task ci` as the core proof.
 */
import type { t } from './common.ts';
import { LocalRepoAuthorities } from './m.LocalRepoAuthorities.ts';
import { LocalRepoFixture } from './m.LocalRepoFixture.ts';

export const TmplTesting: t.TmplTesting.Lib = {
  LocalRepoAuthorities,
  LocalRepoFixture,
};
