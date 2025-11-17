import type { t } from './common.ts';

/**
 * UI tools for working with CRDT Document handles.
 */
export type DocumentLib = {
  readonly Id: t.DocumentIdLib;
  readonly Info: t.FC<t.DocumentProps>;
};

/**
 * Component:
 */
export type DocumentProps = {
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
