/**
 * 🐷
 * NB: placeholder exports to ensure template imports don't error.
 */
export type * as t from './t.ts';

/**
 * @system
 */
export * from '../src/common.ts';

/**
 * UI related components referenced by template files.
 */
export { Color, css } from '@sys/ui-css';
export { LocalStorage } from '@sys/ui-dom';
export { Signal } from '@sys/ui-react';
export { Button, ObjectView } from '@sys/ui-react-components';
