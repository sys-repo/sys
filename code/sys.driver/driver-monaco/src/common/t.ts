/**
 * @external
 */
export type { ReactElement, MouseEventHandler as ReactMouseEventHandler, ReactNode } from 'react';
export type * from '../t.def.monaco.ts';

/**
 * @system
 */
export type * from '@sys/types';

export type { ColorTheme } from '@sys/color/t';
export type { EmitEvent, EmitEventSchedule, EventFilterLib } from '@sys/event/t';
export type { Infer, Schema, TSchema } from '@sys/schema/t';
export type { SpecImports } from '@sys/testing/t';
import type * as TCss from '@sys/ui-css/t';
export type CssEdgesInput = TCss.CssEdges.Input;
export type CssInput = TCss.Style.Input;
export type CssProps = TCss.Style.Props;
export type { Keyboard } from '@sys/ui-dom/t';
export type {
  ButtonFlags,
  ObjectViewProps,
  TreeHostViewNodeList,
} from '@sys/ui-react-components/t';
export type { DevCtx } from '@sys/ui-react-devharness/t';
export type { FC } from '@sys/ui-react/t';
export type {
  Yaml,
  YamlError,
  YamlLib,
  YamlSyncArgsInput,
  YamlSyncParsed,
  YamlSyncParser,
  YamlSyncParserDocs,
  YamlSyncParserPaths,
} from '@sys/yaml/t';

/**
 * @drivers
 */
export type { A, Crdt } from '@sys/driver-automerge/t';

/**
 * CRDT
 */

// Store:
import type { Crdt as AMDriver } from '@sys/driver-automerge/t';
export type CrdtRepo = AMDriver.Repo;

// Document - ImmutableRef<T>
type O = Record<string, unknown>;
export type CrdtRef<T extends O = O> = AMDriver.Ref<T>;

/**
 * @local
 */
export type * from '../types.ts';

// Sundry:
export type Offset = { readonly lineNumber: number; readonly column: number };
export type DisposeFn = () => void;
