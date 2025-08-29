/**
 * @system
 */
export type * from '@sys/types';

/** User Interface: */
export type { ColorTheme } from '@sys/color/t';
export type { CssEdgesInput, CssInput, CssMarginArray, CssProps, CssValue } from '@sys/ui-css/t';

/** Type Schema: */
export type * from '@sys/schema/t/primitives';
export type { Factory, Infer, Plan, ReactRegistration } from '@sys/ui-factory/t';

/**
 * @local
 */
export type * from '../t.ts';
