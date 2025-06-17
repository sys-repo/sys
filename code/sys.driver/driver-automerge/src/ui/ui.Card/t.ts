import type { t } from './common.ts';

export type CardProps = {
  repo: t.CrdtRepo | undefined;
  sync?: { url?: t.StringUrl; enabled?: boolean };
  localstorageKey?: string;

  // Signals:
  signals?: {
    docId?: t.Signal<t.StringId | undefined>;
    doc?: t.Signal<t.CrdtRef | undefined>;
  };

  //
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  headerStyle?: { topOffset?: number };

  //
  onReady?: CardReadyHandler;
  onChange?: CardChangedHandler;

  onActionClick?: () => void;
  onDocIdTextChange?: t.TextInputChangeHandler;
  onSyncEnabledChange?: (e: { enabled: boolean }) => void;
};

/**
 * Events:
 */
export type CardReadyHandler = t.DocumentIdInputReadyHandler;
export type CardChangedHandler = t.DocumentIdInputChangedHandler;
