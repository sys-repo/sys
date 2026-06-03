/**
 * @external
 */
export type { ReactNode } from 'react';
export type { IconType } from 'react-icons';

/**
 * @system
 */
export type * from '@sys/types';
export type { ColorConstants, ColorTheme } from '@sys/color/t';

export type {
  SpecImport,
  SpecImporter,
  SpecImports,
  SpecModule,
  TestHandlerArgs,
  TestModel,
  TestSuiteDescribe,
  TestSuiteModel,
  TestSuiteRunResponse,
} from '@sys/testing/t';

import type * as TCss from '@sys/ui-css/t';
export type CssEdgesArray = TCss.CssEdges.Array;
export type CssInput = TCss.Style.Input;
export type CssMarginArray = TCss.CssEdges.Margin.Array;
export type CssMarginInput = TCss.CssEdges.Margin.Input;
export type CssPaddingArray = TCss.CssEdges.Padding.Array;
export type CssValue = TCss.Style.Value;

export type { Keyboard } from '@sys/ui-dom/t';

/**
 * @local
 */
export type UrlInput = string | URL | Location;

/**
 * Query string index.
 */
export type DefaultsQueryString = {
  d: string; // NB: alias for "?dev"
  dev: string;
  selected: string;
  filter: string;
};

export type * from '../types.ts';
