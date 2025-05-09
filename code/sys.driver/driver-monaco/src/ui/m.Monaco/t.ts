import type { t } from './common.ts';

/**
 * Code editor library:
 */
export type MonacoLib = {
  readonly Editor: React.FC<t.MonacoEditorProps>;
};
