import type { t } from './common.ts';
export type * from './t.hook.ts';

/** The various states the action button can assume. */
export type DocumentIdInputAction = 'Load' | 'Create' | 'Clear';

/**
 * Library: editor for repo-document ID loader.
 */
export type DocumentIdInputLib = {
  readonly View: React.FC<t.DocumentIdInputProps>;
  readonly useController: t.UseDocumentIdHook;
};

/**
 * <Component>:
 */
export type DocumentIdInputProps = {
  debug?: boolean;
  controller?:
    | t.DocumentIdHook //         ← controlled.
    | t.UseDocumentIdHookArgs; // ← uncontrolled (auto-create).
  label?: string;
  placeholder?: string;
  enabled?: boolean;
  autoFocus?: boolean | number;

  // Appearance:
  theme?: t.CommonTheme;
  style?: t.CssInput;
  buttonStyle?: t.CssInput;
  background?: string | number;

  // Events:
  onReady?: t.DocumentIdInputReadyHandler;
  onChange?: t.DocumentIdInputChangedHandler;
};

/**
 * Events:
 */
export type DocumentIdInputReadyHandler = (e: DocumentIdInputChanged) => void;

export type DocumentIdInputActionHandler = (e: DocumentIdInputActionArgs) => void;
export type DocumentIdInputActionArgs = { readonly action: DocumentIdInputAction };

export type DocumentIdInputChangedHandler = (e: DocumentIdInputChanged) => void;
export type DocumentIdInputChanged = {
  readonly signals: t.DocumentIdHookSignals;
  readonly values: t.DocumentIdHookSignalValues;
};
