import { type t } from './common.ts';

/** Compact CRDT-sync toggle props. */
export type Props = {
  repo?: t.CrdtRepo;
  debug?: boolean;
  storageKey?: t.StringKey;
  mode?: 'default' | 'switch-only' | 'switch + network-icons';
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onChange?: (e: { enabled: boolean }) => void;
};
