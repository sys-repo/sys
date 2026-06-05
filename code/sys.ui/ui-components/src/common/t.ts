export type {
  FC,
  JSX,
  ReactNode,
  MouseEvent as ReactMouseEvent,
  KeyboardEvent as ReactKeyboardEvent,
} from 'react';

/**
 * @system:
 */
export type * from '@sys/types';
import type * as TCss from '@sys/ui-css/t';
export type { CssDom, CssEdges, CssTmpl, Style, WebFont } from '@sys/ui-css/t';
export type CssNumberOrStringInput = TCss.Style.NumberOrStringInput;
export type CssEdgesInput = TCss.CssEdges.Input;
export type CssEdgesArray = TCss.CssEdges.Array;
export type CssEdgesQuad = TCss.CssEdges.Quad;
export type CssMarginInput = TCss.CssEdges.Margin.Input;
export type CssMarginArray = TCss.CssEdges.Margin.Array;
export type CssPaddingInput = TCss.CssEdges.Padding.Input;
export type CssProps = TCss.Style.Props;
export type CssValue = TCss.Style.Value;
export type CssInput = TCss.Style.Input;
export type CssShadow = TCss.Style.Shadow.Input;
export type WebFontConfig = TCss.WebFont.Config;

export type { ColorTheme } from '@sys/color/t';
export type { MediaResolver, Timecode } from '@sys/std/t';
export type { SpecImports } from '@sys/testing/t';
export type { TextFilter } from '@sys/text/t';
export type { Keyboard, LocalStorage } from '@sys/ui-dom/t';
export type {
  PointerDragdropSnapshot,
  PointerDragSnapshot,
  PointerEventsArg,
  PointerEventsHandler,
  PointerHookFlags,
  ReactChildren,
} from '@sys/ui-react/t';
export type { TimecodeState } from '@sys/ui-state/t';

/**
 * @local:
 */
export type * from '../types.ts';
