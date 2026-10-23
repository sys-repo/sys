import type { t } from './common.ts';

type IRange = t.Monaco.I.IRange;
type Trigger = 'editor' | 'crdt';

/** Events running within the editor runtime environment. */
export type Shape = Debug | CrdtShape | YamlShape | PingRequest | PingResponse;

/** Generic debug event. */
export type Debug = {
  readonly kind: 'editor:debug';
  readonly msg?: string;
  readonly source?: string;
};

/** CRDT/editor event union. */
export type CrdtShape = CrdtText | CrdtMarks | CrdtFoldingShape;

/** Fires when CRDT text changes and is reflected in the editor. */
export type CrdtText = {
  readonly kind: 'editor:crdt:text';
  readonly trigger: Trigger;
  readonly path: t.ObjectPath;
  readonly change: { readonly before: string; readonly after: string };
};

/** Fires when CRDT mark ranges change. */
export type CrdtMarks = {
  readonly kind: 'editor:crdt:marks';
  readonly trigger: Trigger;
  readonly path: t.ObjectPath;
  readonly change: { readonly before: IRange[]; readonly after: IRange[] };
};

/** Code-folding event union. */
export type CrdtFoldingShape = CrdtFoldingReady | CrdtFolding;

/** Fires when CRDT folding integration is ready. */
export type CrdtFoldingReady = {
  readonly kind: 'editor:crdt:folding:ready';
  readonly areas: IRange[];
};

/** Fires when CRDT-backed folding areas change. */
export type CrdtFolding = {
  readonly kind: 'editor:crdt:folding';
  readonly trigger: Trigger;
  readonly areas: IRange[];
};

/** YAML editor event union. */
export type YamlShape = YamlData | YamlCursor;

/** YAML parse/sync event. */
export type YamlData = t.YamlSyncParsed & {
  readonly kind: 'editor:yaml';
  readonly editorId: t.StringId;
};

/** YAML cursor event. */
export type YamlCursor = t.MonacoDriver.Cursor & {
  readonly kind: 'editor:yaml:cursor';
};

/** Addressable editor state domains that can answer a ping. */
export type PingKind = 'yaml' | 'cursor';

/** Request that authoritative modules re-emit latest state. */
export type PingRequest = {
  readonly kind: 'editor:ping';
  readonly request: readonly PingKind[];
  readonly editorId?: t.StringId;
  readonly nonce: string;
};

/** Optional acknowledgement from responders. */
export type PingResponse = {
  readonly kind: 'editor:pong';
  readonly at: t.UnixEpoch;
  readonly states: readonly PingKind[];
  readonly nonce: string;
};
