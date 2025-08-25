import type { t } from '../common.ts';

export type ViewId = 'Panel:view' | 'Hello:view' | 'List:view';
type Errs = readonly t.UseFactoryValidateError<ViewId>[];

export const errors1: Errs = [
  {
    id: 'Panel:view',
    path: ['title'],
    message: 'Expected string',
  },
  {
    id: 'Panel:view',
    path: ['count'],
    message: 'Expected integer',
  },
];

export const errors2: Errs = [
  {
    id: 'Hello:view',
    path: ['name'],
    message: 'Required property missing',
  },
];

export const errors3: Errs = [
  {
    id: 'List:view',
    path: ['items', '0', 'label'],
    message: 'Expected non-empty string',
  },
  {
    id: 'List:view',
    path: ['items', '2', 'value'],
    message: 'Expected number',
  },
];

export const Sample = {
  errors1,
  errors2,
  errors3,
} as const;
