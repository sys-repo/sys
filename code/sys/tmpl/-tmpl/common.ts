/**
 * 🐷
 * NB: placeholder exports to ensure template imports don't error.
 */
import type * as t from './common.t.ts';
export { t };

export * from '../src/common.ts';

/**
 * @ui refs:
 */
export { Color, css } from '@sys/ui-css';
export { LocalStorage } from '@sys/ui-dom';
export { Signal } from '@sys/ui-react';
export { Button, ObjectView } from '@sys/ui-react-components';
