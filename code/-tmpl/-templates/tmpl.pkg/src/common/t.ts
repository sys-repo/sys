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
export type { Style } from '@sys/ui-css/t';
export type { Keyboard } from '@sys/ui-dom/t';
export type { DevCtx } from '@sys/ui-dev/react/devharness/t';

/**
 * @local
 */
export type * from '../types.ts';
