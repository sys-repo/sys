import type { t } from './common.ts';

export type SampleLoaderLib = {
  readonly Result: t.FC<t.SampleResultProps>;
};

/**
 * Component:
 */
export type SampleResultProps = {
  spinning?: boolean;
  response?: unknown;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
