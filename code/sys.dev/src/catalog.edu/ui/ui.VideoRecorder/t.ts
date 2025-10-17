import type { t } from './common.ts';

/**
 * Component:
 */
export type VideoRecorderViewProps = {
  repo?: t.Crdt.Repo;
  documentId?: t.VideoRecorderViewDocumentIdProps;
  signals?: t.VideoRecorderViewSignals;

  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Properties for the <DocumentId> view within the recorder config.
 */
export type VideoRecorderViewDocumentIdProps = {
  visible?: boolean;
  readOnly?: boolean;
  localstorage?: t.StringKey;
  urlKey?: t.StringKey;
};

/**
 * State wrapped in signals.
 */
export type VideoRecorderViewSignals = {
  doc?: t.Signal<t.Crdt.Ref | undefined>;
  camera?: t.Signal<MediaDeviceInfo | undefined>;
  audio?: t.Signal<MediaDeviceInfo | undefined>;
};
