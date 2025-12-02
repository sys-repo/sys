import * as t from './t.ts';

export const done = (exit: number | boolean = false): t.RunReturn => ({ exit });
