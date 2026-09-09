/**
 * @external
 */
export type { FC, ReactElement, ReactNode } from 'react';

/**
 * @system
 */
export type * from '@sys/types';
export type { Files } from '@sys/model/files/t';

/** User-interface: */
export type { Color } from '@sys/color/t';
export type { SpecImports, TestingDir } from '@sys/testing/t';
import type * as TCss from '@sys/ui-css/t';
export type CssEdgesInput = TCss.CssEdges.Input;
export type CssInput = TCss.Style.Input;
export type CssMarginArray = TCss.CssEdges.Margin.Array;
export type CssProps = TCss.Style.Props;
export type CssValue = TCss.Style.Value;
export type { Keyboard } from '@sys/ui-dom/t';
export type { DevCtx } from '@sys/ui-dev/react/devharness/t';
export type { KeyValue } from '@sys/ui-components/t';

/**
 * @local
 */
export type * from '../types.ts';
