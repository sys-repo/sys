import type { t } from './common.ts';
export type * from './t.hooks.ts';

/**
 * Library: repository UI tools.
 */
export type RepoLib = {
  readonly View: React.FC<t.RepoProps>;
  readonly useRepo: t.UseRepoHook;
};

/**
 * <Component>:
 */
export type RepoProps = {
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
