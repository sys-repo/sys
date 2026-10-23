import type { t } from './common.ts';

/** Ownership component runtime surface. */
export type OwnershipLib = {
  readonly UI: t.FC<t.OwnershipProps>;
};

/**
 * Component:
 */
export type OwnershipProps = {
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
