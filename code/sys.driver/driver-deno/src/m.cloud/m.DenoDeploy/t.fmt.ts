import type { CliSpinner } from '@sys/cli/types';

import type { t } from './common.ts';
import type * as p from './t.pipeline.ts';

/**
 * Formatter surface for operator-facing deploy output.
 */
export type Lib = {
  /** Style spinner text for staged deploy progress. */
  spinnerText(text: string): string;

  /** Create a styled spinner for staged deploy progress. */
  spinner(text: string): CliSpinner.Instance;

  /** Listen to a pipeline handle and render operator-facing progress/output. */
  listen(deployment: p.Handle): t.Lifecycle;
};
