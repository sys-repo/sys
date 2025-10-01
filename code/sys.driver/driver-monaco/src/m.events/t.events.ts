import type { t } from './common.ts';

type IRange = t.Monaco.I.IRange;

/**
 * Events running within the Editor's runtime environment.
 */
export type EditorEvent = EventDebug | EventsCrdt | EventsYaml;

/** Generic debug event (helper). */
export type EventDebug = {
  readonly kind: 'editor:debug';
  readonly msg?: string;
  readonly source?: string;
};

/**
 * CRDT/Editor Events:
 */
export type EventsCrdt = EventCrdtText | EventCrdtMarks | EventsCrdtFolding;
type Trigger = 'editor' | 'crdt';

/** Fires when CRDT text changes (and is reflected in the editor). */
export type EventCrdtText = {
  readonly kind: 'editor:crdt:text';
  readonly trigger: Trigger;
  readonly path: t.ObjectPath;
  readonly change: { readonly before: string; readonly after: string };
};

/** Fires when CRDT mark ranges change (folds are a view of these). */
export type EventCrdtMarks = {
  readonly kind: 'editor:crdt:marks';
  readonly trigger: Trigger;
  readonly path: t.ObjectPath;
  readonly change: { readonly before: IRange[]; readonly after: IRange[] };
};

/**
 * Code Folding Events:
 */
export type EventsCrdtFolding = EventCrdtFoldingReady | EventCrdtFolding;
export type EventCrdtFoldingReady = {
  readonly kind: 'editor:crdt:folding:ready';
  readonly areas: IRange[];
};
export type EventCrdtFolding = {
  readonly kind: 'editor:crdt:folding';
  readonly trigger: Trigger;
  readonly areas: IRange[];
};

/**
 * YAML Editor Events:
 */
export type EventsYaml = EventYaml | EventYamlCursor;
export type EventYaml = t.YamlSyncParseResult & {
  readonly kind: 'editor:yaml';
  readonly editorId: t.StringId;
};
export type EventYamlCursor = t.EditorCursor & {
  readonly kind: 'editor:yaml:cursor';
};
