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

/** Type Schema: */
export type { TBoolean, TObject, TOptional, TString } from '@sys/schema/t';
export type { Factory, Infer, Plan, ReactRegistration } from '@sys/ui-factory/t';

/**
 * @local
 */
export type * from '../t.ts';
