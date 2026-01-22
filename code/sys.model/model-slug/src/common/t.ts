/**
 * @system
 */
export type * from '@sys/types';

export type {
  ArrSpec,
  SchemaError,
  SchemaResult,
  StandardSchemaV1,
  TimecodePlaybackSchemaLib,
  TSchema,
  ValueError,
} from '@sys/schema/t';
export type { Timecode } from '@sys/std/t';

/**
 * @local
 */
export type * from '../types.ts';
