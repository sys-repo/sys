import type { t } from './-t.ts';

export * from '../common.ts';
export type * as t from './-t.ts';

export { Signal } from '@sys/ui-react';
export { Dev, Spec } from '@sys/ui-react-devharness/react';
export { Button } from '@sys/ui-react-components/button';
export { ObjectView } from '@sys/ui-react-components/object-view';
export { LocalStorage } from '@sys/ui-dom';

const endpoint: t.StringUrl = 'ws://localhost:5051/files';
const timeout: t.Msecs = 3_000;

export const SPEC = {
  endpoint,
  timeout,
} as const;
