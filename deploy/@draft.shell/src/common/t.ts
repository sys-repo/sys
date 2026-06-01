/**
 * @external
 */
export type { FC, ReactElement, ReactNode } from 'react';

/**
 * @system
 */
export type * from '@sys/types';
export type { Files } from '@sys/model/files/t';

/** User-interface: */
export type { ColorTheme } from '@sys/color/t';
export type { SpecImports, TestingDir } from '@sys/testing/t';
export type { CssEdgesInput, CssInput, CssMarginArray, CssProps, CssValue } from '@sys/ui-css/t';
export type { Keyboard } from '@sys/ui-dom/t';
export type { DevCtx } from '@sys/ui-react-devharness/t';
export type { KeyValue } from '@sys/ui-react-components/t';

/**
 * @local
 */
export type * from '../types.ts';
