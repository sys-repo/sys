import type { t } from './common.ts';
export type * from './t.hooks.ts';

/**
 * Library: repository UI tools.
 */
export type RepoLib = {
  readonly SyncEnabledSwitch: React.FC<t.SyncEnabledSwitchProps>;
  readonly useRepo: t.UseRepoHook;
};

/**
 * <Component>:
 */
export type SyncEnabledSwitchProps = {
  endpoint?: t.StringUrl;
  enabled?: boolean;
  peerId?: t.StringId;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onChange?: (e: { enabled: boolean }) => void;
};
