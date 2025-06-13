import type { t } from './common.ts';

export type DocumentIdInputAction = 'Load' | 'Create';

/**
 * <Component>:
 */
export type DocumentIdInputProps = {
  label?: string;
  docId?: t.StringId;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onActionClick?: () => t.DocumentIdInputActionHandler;
  onTextChange?: t.TextInputChangeHandler;
};

/**
 * Events:
 */
export type DocumentIdInputActionHandler = (e: DocumentIdInputActionArgs) => void;
export type DocumentIdInputActionArgs = {
  readonly action: DocumentIdInputAction;
};
