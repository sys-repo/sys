import type { t } from './common.ts';

export type DocumentIdInputAction = 'Load' | 'Create';

/**
 * <Component>:
 */
export type DocumentIdInputProps = {
  label?: string;
  value?: t.StringId;
  placeholder?: string;
  state?: DocumentIdHook | UseDocumentIdHookArgs;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onActionClick?: t.DocumentIdInputActionHandler;
  onValueChange?: t.TextInputChangeHandler;
};

/**
 * Events:
 */
export type DocumentIdInputActionHandler = (e: DocumentIdInputActionArgs) => void;
export type DocumentIdInputActionArgs = {
  readonly action: DocumentIdInputAction;
};

/**
 * Controller Hook:
 */
export type UseDocumentIdHook = (args?: UseDocumentIdHookArgs | DocumentIdHook) => DocumentIdHook;
export type UseDocumentIdHookArgs = { repo?: t.CrdtRepo };
export type DocumentIdHook = {
  readonly instance: t.StringId;
  readonly action: DocumentIdInputAction;
  readonly handlers: {
    onActionClick: t.DocumentIdInputActionHandler;
    onValueChange: t.TextInputChangeHandler;
  };
};
