import type { t } from './common.ts';

/**
 * UI tools for working with CRDT Document handles.
 */
export type DocumentLib = {
  readonly Id: t.DocumentIdLib;
  readonly Info: t.FC<t.DocumentProps>;
};

/**
 * Statistics derived from a CRDT documetn.
 */
export type DocumentStats = {
  readonly bytes: number;
  readonly total: {
    readonly changes: number;
    readonly ops: number;
  };
};

/**
 * Component:
 */
export type DocumentProps = {
  doc?: t.Crdt.Ref;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
