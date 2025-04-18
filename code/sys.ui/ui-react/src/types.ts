/**
 * @module
 * Commonly used React types.
 */
import type { JSX } from 'react';
export type { FC } from 'react';

export type * from './m.FC/t.ts';
export type * from './m.Signal/t.ts';
export type * from './m.Testing.Server/t.ts';
export type * from './m.use/t.ts';
export type * from './u/t.ts';

/** The output of a render function. */
export type RenderOutput = JSX.Element | null | undefined | false;

/** Input types that can be passed to a render function */
export type RenderInput = RenderOutput | string | number;
