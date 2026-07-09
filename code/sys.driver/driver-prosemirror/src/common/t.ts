/**
 * @external
 */
export type { ReactElement, MouseEventHandler as ReactMouseEventHandler, ReactNode } from 'react';

/**
 * @system drivers
 */
export type { A, Crdt } from '@sys/driver-automerge/t';

/**
 * @system
 */
export type * from '@sys/types';

export type { Color } from '@sys/color/t';
export type { SpecImports, TestingDir } from '@sys/testing/t';
import type * as TCss from '@sys/ui-css/t';
export type CssInput = TCss.Style.Input;
export type CssProps = TCss.Style.Props;
export type { Keyboard } from '@sys/ui-dom/t';
export type { DevCtx } from '@sys/ui-dev/react/devharness/t';

/**
 * @local
 */
export type * from '../types.ts';
