import type { t } from './common.ts';

/**
 * Library: repository UI tools.
 */
export type RepoLib = {
  readonly SyncEnabledSwitch: React.FC<t.SyncEnabledSwitchProps>;
};

/**
 * <Component>:
 */
export type SyncEnabledSwitchProps = {
  repo?: t.CrdtRepo;
  debug?: boolean;
  localstorage?: t.StringKey;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onChange?: (e: { enabled: boolean }) => void;
};
