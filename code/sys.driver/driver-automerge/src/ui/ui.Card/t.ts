import type { t } from './common.ts';

export type CardProps = {
  syncServer?: { url?: t.StringUrl; enabled?: boolean };
  repo?: t.CrdtRepo;
  docId?: t.Signal<t.StringId | undefined>;
  doc?: t.Signal<t.CrdtRef | undefined>;

  //
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  headerStyle?: { topOffset?: number };

  //
  onActionClick?: () => void;
  onDocIdTextChange?: t.TextInputChangeHandler;
  onSyncEnabledChange?: (e: { next: boolean }) => void;
};
