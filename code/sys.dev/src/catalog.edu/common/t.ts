/**
 * @system
 */
export type * from '@sys/types';

export type { Crdt } from '@sys/driver-automerge/t';
export type { Yaml } from '@sys/std/t';

/** User Interface: */
export type { ColorTheme } from '@sys/color/t';
export type { CssEdgesInput, CssInput, CssMarginArray, CssProps, CssValue } from '@sys/ui-css/t';

/** Type Schema: */
export type { Infer, Schema } from '@sys/schema/t';
export type * from '@sys/schema/t/primitives';
export type * from '@sys/ui-factory/t';

/**
 * @local
 */
export type * from '../t.inferred.ts';
export type * from '../t.ts';

// UI:
export type * from '../ui/-sample/t.ts';
