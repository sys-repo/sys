import type { t } from './common.ts';

export type CardProps = {
  sync?: { url?: t.StringUrl };
  factory?: t.RepoHookFactory;

  localstorageKey?: string;
  textMaxLength?: number;

  // Signals:
  signals?: Partial<
    Pick<t.RepoHookSignals, 'repo' | 'syncEnabled'> & Pick<t.DocumentIdHookSignals, 'doc' | 'docId'>
  >;

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
export type CardReadyHandler = t.DocumentIdReadyHandler;
export type CardChangedHandler = t.DocumentIdChangedHandler;
