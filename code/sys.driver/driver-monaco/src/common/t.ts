type O = Record<string, unknown>;

/**
 * @external
 */
export type { ReactElement, MouseEventHandler as ReactMouseEventHandler, ReactNode } from 'react';
export type * from '../t.def.monaco.ts';

/**
 * @drivers
 */
export type { A, Crdt, DocumentIdProps } from '@sys/driver-automerge/t';

/**
 * CRDT
 */

// Store:
import type { Crdt as AMDriver } from '@sys/driver-automerge/t';
export type CrdtRepo = AMDriver.Repo;

// Document - ImmutableRef<T>
export type CrdtRef<T extends O = O> = AMDriver.Ref<T>;
// 🐷
// import type { Crdt as CrdtSys } from '@sys/crdt/t';
// export type CrdtRef<T extends O = O> = CrdtSys.Ref<T>;

/**
 * @system
 */
export type * from '@sys/types';

export type { ColorTheme } from '@sys/color/t';
export type { Infer, Schema, TSchema } from '@sys/schema/t';
export type {
  Yaml,
  YamlError,
  YamlLib,
  YamlSyncArgsInput,
  YamlSyncParsed,
  YamlSyncParser,
  YamlSyncParserDocs,
  YamlSyncParserPaths,
} from '@sys/std/t';
export type { SpecImports } from '@sys/testing/t';
export type { CssEdgesInput, CssInput, CssMarginArray, CssProps, CssValue } from '@sys/ui-css/t';
export type { KeyboardModifierFlags } from '@sys/ui-dom/t';
export type { ButtonFlags } from '@sys/ui-react-components/t';
export type { DevCtx } from '@sys/ui-react-devharness/t';

/**
 * @local
 */
export type * from '../types.ts';

/**
 * Sundry:
 */
export type Offset = { lineNumber: number; column: number };
export type DisposeFn = () => void;
