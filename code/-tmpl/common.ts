/**
 * 🐷
 * NB: placeholder exports to ensure template imports don't error.
 */
export type * as t from './common.t.ts';
export { Templates } from './m.Tmplates.ts';

/**
 * @system
 */
export { makeTmpl } from '@sys/tmpl';
export * from '../sys/tmpl/src/common.ts';

export { Color, css } from '@sys/ui-css';
export { LocalStorage } from '@sys/ui-dom';
export { Signal } from '@sys/ui-react';
export { Button, ObjectView } from '@sys/ui-react-components';
