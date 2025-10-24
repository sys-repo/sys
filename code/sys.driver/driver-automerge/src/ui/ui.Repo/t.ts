import type { t } from './common.ts';

/**
 * UI tools for representing the CRDT repository.
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
  mode?: 'default' | 'switch-only' | 'switch + network-icons';
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onChange?: (e: { enabled: boolean }) => void;
};
