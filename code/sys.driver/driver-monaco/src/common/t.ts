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
 * @system
 */
export type * from '@sys/types';

export type { ColorTheme } from '@sys/color/t';
export type { Static, TSchema } from '@sys/schema/t';
export type {
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
