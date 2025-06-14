import type { t } from './common.ts';

type O = Record<string, unknown>;

/** The various states the action button can assume. */
export type DocumentIdInputAction = 'Load' | 'Create';

/**
 * Library: editor for repo-document ID loader.
 */
export type DocumentIdInputLib = {
  readonly View: React.FC<DocumentIdInputProps>;
  readonly useController: UseDocumentIdHook;
};

/**
 * <Component>:
 */
export type DocumentIdInputProps = {
  controller?:
    | DocumentIdHook /* ← controlled */
    | UseDocumentIdHookArgs /* ← uncontrolled (auto-create) */;
  label?: string;
  placeholder?: string;
  autoFocus?: boolean | number;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Events:
 */
export type DocumentIdInputActionHandler = (e: DocumentIdInputActionArgs) => void;
export type DocumentIdInputActionArgs = { readonly action: DocumentIdInputAction };

/**
 * Controller Hook:
 */
export type UseDocumentIdHook = (args?: UseDocumentIdHookArgs | DocumentIdHook) => DocumentIdHook;
export type UseDocumentIdHookArgs<T = O> = {
  repo?: t.CrdtRepo;
  signals?: Partial<DocumentIdHookSignals>;
  initial?: T | (() => T);
};
export type DocumentIdHook = {
  readonly instance: t.StringId;
  readonly signals: t.DocumentIdHookSignals;
  readonly props: DocumentIdHookProps;
  readonly handlers: {
    onActionClick: t.DocumentIdInputActionHandler;
    onTextChange: t.TextInputChangeHandler;
    onKeyDown: t.TextInputKeyHandler;
  };
};

export type DocumentIdHookProps = {
  readonly action: DocumentIdInputAction;
  readonly id?: string;
  readonly doc?: t.CrdtRef;
  readonly is: {
    readonly valid: boolean;
    readonly enabled: { readonly action: boolean; readonly input: boolean };
    readonly spinning: boolean;
  };
};
export type DocumentIdHookSignals = {
  readonly id: t.Signal<string | undefined>;
  readonly doc: t.Signal<t.CrdtRef | undefined>;
  readonly spinning: t.Signal<boolean>;
};
