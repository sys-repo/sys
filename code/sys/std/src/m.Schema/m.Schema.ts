import { Type, type Static } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import { type t } from './common.ts';

export type { Static };

export { Type, Value };
export const Schema: t.SchemaLib = { Type, Value } as const;
