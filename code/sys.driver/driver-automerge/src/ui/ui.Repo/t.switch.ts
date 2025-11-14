import { type t } from './common.ts';

/**
 * Compact CRDT-sync toggle.
 *
 * Presents a switch bound to a `CrdtRepo` and, depending on `mode`,
 * optionally surfaces network info (peer ID, remote host) via icons/text.
 *
 * Modes:
 * - `default`: switch + host + peer label.
 * - `switch-only`: only the toggle.
 * - `switch + network-icons`: switch plus status icons (peer / server).
 *
 * Persists the last toggle state when `localstorage` is provided.
 * Emits `{ enabled }` on change.
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
