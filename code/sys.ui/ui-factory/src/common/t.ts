/**
 * @external
 */
export type { JSX, ReactElement, ReactNode } from 'react';

/**
 * @system
 */
export type * from '@sys/types';

export type { ColorTheme } from '@sys/color/t';
export type { FileMapProcessor } from '@sys/fs/t';
export type { Static, TSchema, ValueError } from '@sys/schema/t';
export type { ErrCatch, ErrFail } from '@sys/std/t';
export type { SpecImports, TestingDir } from '@sys/testing/t';
export type {
  Tmpl,
  TmplFactoryOptions,
  TmplFileOperation,
  TmplFilter,
  TmplLogTableOptions,
  TmplWriteOptions,
  TmplWriteResponse,
} from '@sys/tmpl-engine/t';
export type { CssEdgesInput, CssInput, CssMarginArray, CssProps, CssValue } from '@sys/ui-css/t';
export type { KeyboardModifierFlags } from '@sys/ui-dom/t';
export type { DevCtx } from '@sys/ui-react-devharness/t';

/**
 * @local
 */
export type * from '../types.ts';
