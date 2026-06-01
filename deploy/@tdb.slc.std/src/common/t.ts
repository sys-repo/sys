/**
 * @external
 */
export type { FC, ReactElement, ReactNode } from 'react';

/**
 * @system
 */
export type * from '@sys/types';

export type { ColorTheme } from '@sys/color/t';
export type { SpecImports, TestingDir } from '@sys/testing/t';
export type { CssEdgesInput, CssInput, CssMarginArray, CssProps, CssValue } from '@sys/ui-css/t';
export type { Keyboard } from '@sys/ui-dom/t';
export type { SvgElement, SvgInstance } from '@sys/ui-react-components/t';
export type { DevCtx } from '@sys/ui-react-devharness/t';

/**
 * @local
 */
export type * from '../types.ts';
