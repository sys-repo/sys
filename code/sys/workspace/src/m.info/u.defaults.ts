import { type t } from './common.ts';

/** Canonical default policy for workspace info metrics. */
export const DEFAULTS: t.WorkspaceInfo.Defaults = {
  testPathRules: [
    {
      kind: 'ui-spec-test',
      directorySegments: {
        exact: ['-spec'],
        prefixes: ['-spec.'],
      },
    },
    {
      kind: 'unit-test',
      basenamePatterns: [/(^|[._-])test\.tsx?$/],
      directorySegments: {
        exact: ['-test', '__tests__'],
        prefixes: ['-test.'],
      },
    },
  ],
};
