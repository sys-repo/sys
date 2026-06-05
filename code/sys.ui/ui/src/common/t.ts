/**
 * @external
 */
export type { FC, ReactElement, ReactNode } from 'react';

/**
 * @system
 */
export type * from '@sys/types';

/** User-interface: */
export type { ColorTheme } from '@sys/color/t';
export type { SpecImports, TestingDir } from '@sys/testing/t';
import type * as TCss from '@sys/ui-css/t';
export type CssInput = TCss.Style.Input;
export type { Keyboard } from '@sys/ui-dom/t';

/**
 * @local
 */
export type * from '../types.ts';
