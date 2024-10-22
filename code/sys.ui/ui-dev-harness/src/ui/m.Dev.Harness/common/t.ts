/**
 * @external
 */
export type { IconType } from 'react-icons';

/**
 * @system
 */

export type {
  SpecImport,
  SpecImporter,
  SpecImports,
  SpecModule,
  TestSuiteDescribe,
  TestHandlerArgs,
  TestModel,
  TestSuiteModel,
  TestSuiteRunResponse,
} from '@sys/testing/t';

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

export type * from '../t.ts';
export type * from '../../../common/t.ts';
