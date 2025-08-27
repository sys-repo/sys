/**
 * @external
 */
export type { ReactElement, ReactNode } from 'react';

/**
 * @system
 */
export type * from '@sys/types';

export type { ColorTheme } from '@sys/color/t';
export type { CssEdgesInput, CssInput, CssMarginArray, CssProps, CssValue } from '@sys/ui-css/t';

export type { Plan, ReactRegistration, Infer } from '@sys/ui-factory/t';
export type { TObject, TString, TOptional, TBoolean } from '@sys/schema/t'; // ← precise TypeBox types

/**
 * @local
 */
export type * from '../t.ts';
