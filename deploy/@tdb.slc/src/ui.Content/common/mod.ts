export * from '../../ui/common.ts';
export { Icons } from '../ui.Icons.ts';

export * from './libs.ts';
export type * as t from './t.ts';

/**
 * A curried image importer helpers.
 */
export function i(importer: () => Promise<any>) {
  return async () => {
    return (await importer()).default as string;
  };
}
