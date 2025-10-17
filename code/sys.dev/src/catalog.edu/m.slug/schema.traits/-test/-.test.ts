import {
  CheckSchemaConcrete,
  CheckSchemaExact,
  CheckSchemaKeys,
  Expect,
} from '@sys/schema/testing';

import { type t } from '../common.ts';
import { VideoPlayerPropsSchema } from '../m.video.player.ts';
import { VideoRecorderPropsSchema } from '../m.video.recorder.ts';

/**
 * Compile-time schema/type locks.
 *
 * Ensures each schema:
 *   • infers a concrete type (not any / unknown / never)
 *   • has an identical key set to its public type
 *   • matches the public type exactly (no rename / drift / extras)
 *
 * Any mismatch between schema ↔ generated types fails at compile-time.
 * No runtime test required.
 */
type _P_Concrete = Expect<CheckSchemaConcrete<typeof VideoPlayerPropsSchema>>;
type _R_Concrete = Expect<CheckSchemaConcrete<typeof VideoRecorderPropsSchema>>;

type _P_Keys = Expect<CheckSchemaKeys<typeof VideoPlayerPropsSchema, t.VideoPlayerProps>>;
type _R_Keys = Expect<CheckSchemaKeys<typeof VideoRecorderPropsSchema, t.VideoRecorderProps>>;

type _Lock_P = Expect<CheckSchemaExact<typeof VideoPlayerPropsSchema, t.VideoPlayerProps>>;
type _Lock_R = Expect<CheckSchemaExact<typeof VideoRecorderPropsSchema, t.VideoRecorderProps>>;

// @ts-expect-error TS2344: Type 'false' does not satisfy the constraint 'true'.
type __SANITY_FAIL = Expect<CheckSchemaExact<typeof VideoRecorderPropsSchema, t.VideoPlayerProps>>;
