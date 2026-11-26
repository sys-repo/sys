import { D as Base } from '../common.ts';

export * from '../common.ts';
export type * as t from './-t.ts';

export { LocalStorage } from '@sys/ui-dom';
export { Signal } from '@sys/ui-react';
export { Dev } from '../../../-test.ui.ts';

/** Distinct spec/storage identity; never reuse the isolated view's preference store. */
export const D = { ...Base, displayName: `${Base.displayName}.Integration` } as const;
export const STORAGE_KEY = { DEV: `dev:${D.displayName}` };
