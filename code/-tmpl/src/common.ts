/**
 * 🐷
 * NB: placeholder exports to ensure template imports don't error.
 */
import type * as t from './common.t.ts';
export { t };

export * from './pkg.deno/src/common.ts';

/**
 * UI Refs:
 */
export { c, Cli } from '@sys/cli';
export { DenoFile } from '@sys/driver-deno/runtime';
export { Fs, Path } from '@sys/fs';
export { Color, css } from '@sys/ui-css';
export { Signal } from '@sys/ui-react';
export { Button, ObjectView } from '@sys/ui-react-components';

/**
 * Filter out common setup helpers within a mono-repo template.
 */
export const tmplFilter: t.TmplFilter = (e) => {
  if (e.file.name === '.tmpl.ts') return false; // NB: the initialization script for the template: is not content.
  return true;
};
