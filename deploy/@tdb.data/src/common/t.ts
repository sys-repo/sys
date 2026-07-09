/**
 * @external
 */
export type { FC, ReactElement, ReactNode } from 'react';

/**
 * @system
 */
export type * from '@sys/types';

/** User-interface: */
export type { Color } from '@sys/color/t';
export type { SpecImports, TestingDir } from '@sys/testing/t';
import type { CssEdges, Style } from '@sys/ui-css/t';
export type { CssEdges, Style } from '@sys/ui-css/t';
export type CssEdgesInput = CssEdges.Input;
export type CssInput = Style.Input;
export type CssMarginArray = CssEdges.Margin.Array;
export type CssProps = Style.Props;
export type CssValue = Style.Value;
export type { Keyboard } from '@sys/ui-dom/t';
export type { TSchema, ValueError } from '@sys/schema/t';
export type {
  ActionProbe,
  BulletList,
  HttpOrigin as HttpOriginBase,
  UrlTree,
} from '@sys/ui-components/t';
export type { DevCtx, DevSpec } from '@sys/ui-dev/react/devharness/t';
export type * from '@sys/model-slug/client';
export type * from '@sys/model-slug/types';

/**
 * @local
 */
export type * from '../types.ts';
