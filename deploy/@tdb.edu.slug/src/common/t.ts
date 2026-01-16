/**
 * @external
 */
export type { FC, ReactElement, ReactNode } from 'react';

/**
 * @system
 */
export type * from '@sys/types';

/** User interface */
export type { ColorTheme } from '@sys/color/t';
export type { CssEdgesInput, CssInput, CssMarginArray, CssProps, CssValue } from '@sys/ui-css/t';
export type { KeyboardModifierFlags } from '@sys/ui-dom/t';
export type { TreeNodeList } from '@sys/ui-react-components/t';

/** User interface: Testing */
export type { SpecImports, TestingDir } from '@sys/testing/t';
export type { DevCtx } from '@sys/ui-react-devharness/t';

/**
 * @local
 */
export type * from '../m.compiler/common/t.ts';
export type * from '../types.ts';
