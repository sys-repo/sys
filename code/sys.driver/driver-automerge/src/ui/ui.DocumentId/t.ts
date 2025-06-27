import type { t } from './common.ts';
export type * from './t.hooks.ts';

/** The various states the action button can assume. */
export type DocumentIdAction = 'Load' | 'Create' | 'Clear' | 'Copy' | 'Copy:Url';

/**
 * Library: document-id UI tools.
 */
export type DocumentIdLib = {
  readonly View: React.FC<t.DocumentIdProps>;
  readonly useController: t.UseDocumentIdHook;
};

/**
 * <Component>:
 */
export type DocumentIdProps = {
  debug?: boolean;
  controller?:
    | t.DocumentIdHook //         ← controlled.
    | t.UseDocumentIdHookArgs; // ← uncontrolled (auto-create).

  placeholder?: string;
  label?: string;
  labelOpacity?: t.Percent;

  enabled?: boolean;
  autoFocus?: boolean | number;
  readOnly?: boolean;
  urlSupport?: boolean;

  // Appearance:
  theme?: t.CommonTheme;
  style?: t.CssInput;
  buttonStyle?: t.CssInput;
  background?: string | number;

  // Events:
  onReady?: t.DocumentIdReadyHandler;
  onChange?: t.DocumentIdChangedHandler;
};

/**
 * Events:
 */
export type DocumentIdReadyHandler = (e: DocumentIdChanged) => void;

export type DocumentIdActionHandler = (e: DocumentIdActionArgs) => void;
export type DocumentIdActionArgs = { readonly action: DocumentIdAction };

export type DocumentIdChangedHandler = (e: DocumentIdChanged) => void;
export type DocumentIdChanged = {
  readonly is: { readonly head: boolean };
  readonly signals: t.DocumentIdHookSignals;
  readonly values: t.DocumentIdHookSignalValues;
  readonly repo: t.CrdtRepo;
};
