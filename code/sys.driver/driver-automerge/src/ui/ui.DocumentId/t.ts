import type { t } from './common.ts';
export type * from './t.hooks.ts';
export type * from './t.parse.ts';

type ActionParams = ActionParamsCopyUrl | ActionParamsPlain;
type ActionParamsPlain = { action: 'Load' | 'Create' | 'Clear' | 'Copy' };
type ActionParamsCopyUrl = { action: 'Copy:Url'; href: string };

/** The various states the action button can assume. */
export type DocumentIdAction = ActionParams['action'];

/**
 * Library: document-id UI tools.
 */
export type DocumentIdLib = {
  readonly View: React.FC<t.DocumentIdProps>;
  readonly useController: t.UseDocumentIdHook;
  readonly Parse: t.DocumentIdParseLib;
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

/** Handler for when the <DocumentId> is ready. */
export type DocumentIdReadyHandler = (e: DocumentIdChanged) => void;

/** Handler for when the <DocumentId> action button is triggered. */
export type DocumentIdActionHandler = (e: DocumentIdActionArgs) => void;
/** <DocumentId> action tiggered event. */
export type DocumentIdActionArgs = ActionParams;

/** Handler for when the <DocumentId> changes value. */
export type DocumentIdChangedHandler = (e: DocumentIdChanged) => void;
/** The <DocumentId> changed event. */
export type DocumentIdChanged = {
  readonly is: { readonly head: boolean };
  readonly signals: t.DocumentIdHookSignals;
  readonly values: t.DocumentIdHookSignalValues;
  readonly repo: t.CrdtRepo;
};

/** Handler that generates a URL when activated by a user gesture. */
export type DocumentIdUrlFactory = (e: DocumentIdUrlFactoryArgs) => t.StringUrl | undefined;
export type DocumentIdUrlFactoryArgs = {
  readonly docId: t.StringId;
  readonly urlKey: string;
};
