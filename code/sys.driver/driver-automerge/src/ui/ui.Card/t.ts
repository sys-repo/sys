import type { t } from './common.ts';

export type CardProps = {
  repo: t.CrdtRepo | undefined;
  sync?: { url?: t.StringUrl; enabled?: boolean };

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
  onActionClick?: () => void;
  onDocIdTextChange?: t.TextInputChangeHandler;
  onSyncEnabledChange?: (e: { enabled: boolean }) => void;
};

/**
 * Events:
 */
export type CardReadyHandler = (e: CardReadyArgs) => void;
export type CardReadyArgs = {
  readonly signals: t.DocumentIdHookSignals;
  readonly values: t.DocumentIdHookSignalValues;
};
