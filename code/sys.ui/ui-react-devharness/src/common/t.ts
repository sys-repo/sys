/**
 * @external
 */
export type { ReactNode } from 'react';
export type { IconType } from 'react-icons';

/**
 * @system
 */
export type { ColorConstants, ColorTheme } from '@sys/color/t';
export type { ModuleImport, ModuleImporter, ModuleImports, Signal } from '@sys/std/t';
export type * from '@sys/types/t';

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

export type {
  CssEdgesArray,
  CssInput,
  CssMarginArray,
  CssMarginInput,
  CssPaddingArray,
  CssValue,
} from '@sys/ui-css/t';

export type { KeyboardEventsUntil, KeyboardModifierFlags } from '@sys/ui-dom/t';

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
