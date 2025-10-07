/**
 * @module
 * @types Type-library module.
 */
import type { JSX } from 'react';
export type { FC } from 'react';

export type * from './m.Async/t.ts';
export type * from './m.FC/t.ts';
export type * from './m.Signal/t.ts';
export type * from './m.Testing.Server/t.ts';
export type * from './u/t.ts';
export type * from './use/t.ts';

/** The output of a render function. */
export type RenderOutput = JSX.Element | null | undefined | false;

/** Input types that can be passed to a render function */
export type RenderInput = RenderOutput | string | number;
