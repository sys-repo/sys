import type { t } from '../common.ts';
import { START_GUI_RELEASE_EVIDENCE } from './u.start.gui.service.evidence.ts';

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
 * The complete URL, manifest-integrity pin, and package identity come from the generated
 * launcher-evidence leaf for one independently selected and verified Dist. They are neither runtime
 * configuration nor TOFU ("trust on first use").
 */
export const START_GUI_SERVICE = Object.freeze({
  name: 'sys.ui:pi',
  source: START_GUI_RELEASE_EVIDENCE,
}) satisfies Readonly<{ name: string; source: StartGuiEvidence }>;
