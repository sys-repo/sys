/**
 * @external
 */
export type { ReactElement, MouseEventHandler as ReactMouseEventHandler, ReactNode } from 'react';

/**
 * @system
 */
export type * from '@sys/types';

export type { Color } from '@sys/color/t';
export type { SpecImports } from '@sys/testing/t';
import type * as TCss from '@sys/ui-css/t';
export type CssEdgesInput = TCss.CssEdges.Input;
export type CssInput = TCss.Style.Input;
export type CssMarginArray = TCss.CssEdges.Margin.Array;
export type CssProps = TCss.Style.Props;
export type CssValue = TCss.Style.Value;
export type { Keyboard } from '@sys/ui-dom/t';
export type { YamlSyncParser } from '@sys/yaml/t';

export type {
  SheetMarginInput,
  SheetOrientation,
  SheetOrientationY,
  SheetSignalStack,
  SvgElement,
  SvgInstance,
  VideoElementProps,
  VideoPlayerSignals,
  VimeoIFrame,
} from '@sys/ui-components/t';
export type { DevCtx } from '@sys/ui-dev/react/devharness/t';

export type { Crdt } from '@sys/driver-automerge/t';
export type { Monaco } from '@sys/driver-monaco/t';

/**
 * @local
 */
export type * from '../types.ts';
