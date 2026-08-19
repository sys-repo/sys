import type { t } from '../common.ts';

/** Closed internal launcher authority for one GUI Dist session. */
export type StartGuiEvidence = StartGuiReleaseEvidence | StartGuiDevelopmentEvidence;

/** Released-artifact evidence synchronously copied into immutable owner authority. */
export type StartGuiReleaseEvidence = Readonly<{
  kind: 'release';
  manifestUrl: t.StringUrl;
  integrity: t.StringHash;
  expectedPkg: Readonly<t.Pkg>;
}>;

/** Completed-build evidence synchronously copied into immutable owner authority. */
export type StartGuiDevelopmentEvidence = Readonly<{
  kind: 'development';
  dir: t.StringAbsoluteDir;
  integrity: t.StringHash;
  expectedPkg: Readonly<t.Pkg>;
}>;

/**
 * Canonical launcher-owned identity and materialization evidence for the local GUI service.
 *
 * This complete URL, manifest-integrity pin, and package identity is transitional compile-time
 * evidence for the current verified Dist. It is deliberately hard-coded until the release-evidence
 * generation and publication mechanics are complete. It is neither runtime configuration nor
 * TOFU ("trust on first use").
 */
export const START_GUI_SERVICE = Object.freeze({
  name: 'sys.ui:pi',
  source: Object.freeze({
    kind: 'release' as const,
    manifestUrl: 'http://localhost:8080/dist.json',
    integrity: 'sha256-07d24ba144edb1f84eb2db14b10fcd3c3470775ee389b518c0ae9a9b5b2ddfbc',
    expectedPkg: Object.freeze({ name: '@sys/driver-pi', version: '0.0.131' }),
  }),
}) satisfies Readonly<{ name: string; source: StartGuiEvidence }>;
