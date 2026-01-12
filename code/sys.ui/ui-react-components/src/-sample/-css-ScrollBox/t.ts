import type { t } from './common.ts';
export type * from '../../common/t.ts';

/**
 * DevHarness for the css-in-js macro: "ScrollBox"
 */
export type ScrollBoxSampleLib = {
  readonly UI: t.FC<ScrollBoxSampleProps>;
};

/**
 * Component: base view
 */
export type ScrollBoxSampleProps = {
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
