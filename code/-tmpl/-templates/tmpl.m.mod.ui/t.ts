import type { t } from './common.ts';

/**
 *
 */
export type MyComponentLib = {
  readonly UI: t.FC<MyComponentProps>;
};

/**
 * Component:
 */
export type MyComponentProps = {
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
