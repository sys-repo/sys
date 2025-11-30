/**
 * @external
 */
export type { FC, ReactNode } from 'react';

/**
 * @drivers
 */
export type { Crdt, CrdtView } from '@sys/driver-automerge/t';
export type {
  DiagnosticSeverity,
  EditorDiagnostic,
  EditorEvent,
  EditorEventBus,
  EditorYaml,
  Monaco,
  YamlEditorSignals,
} from '@sys/driver-monaco/t';

/**
 * @system
 */
export type * from '@sys/types';

export type { UrlDslRef, UrlRef } from '@sys/immutable/t';
export type { TimecodeEntry, TimecodeMap } from '@sys/std/t';
export type { Yaml } from '@sys/yaml/t';

/** User Interface: */
export type { ColorTheme } from '@sys/color/t';
export type { SpecImports, TestingDir } from '@sys/testing/t';
export type { CssEdgesInput, CssInput, CssMarginArray, CssProps, CssValue } from '@sys/ui-css/t';
export type { DomUrlBindOptions } from '@sys/ui-dom/t';
export type {
  CropmarksProps,
  KeyValueItem,
  MediaDevicesFilter,
  MediaRecorderStatus,
  MediaVideoStreamProps,
  ObjectViewProps,
  TreeNode,
  TreeNodeList,
} from '@sys/ui-react-components/t';

/** Type Schema: */
export type { Schema, SpecWith } from '@sys/schema/t';
export type * from '@sys/schema/t/primitives';
export type * from '@sys/ui-factory/t';

/**
 * @local
 */
export type * from '../types.ts';
