import type { t } from './common.ts';

/**
 * Component:
 */
export type CrdtLayoutProps = {
  repo?: t.Crdt.Repo;
  documentId?: CrdtLayoutDocumentIdProps;
  signals?: CrdtLayoutSignals;
  configVisible?: boolean;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Properties for the <DocumentId> view within the recorder config.
 */
export type CrdtLayoutDocumentIdProps = {
  visible?: boolean;
  readOnly?: boolean;
  localstorage?: t.StringKey;
  urlKey?: t.StringKey;
};

/**
 * State wrapped in signals.
 */
export type CrdtLayoutSignals = {
  doc?: t.Signal<t.Crdt.Ref | undefined>;
  camera?: t.Signal<MediaDeviceInfo | undefined>;
  audio?: t.Signal<MediaDeviceInfo | undefined>;
};
