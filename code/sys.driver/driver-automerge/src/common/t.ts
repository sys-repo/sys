/**
 * @external
 */
export type { Observable, Subject } from 'rxjs';
export type * from './t.Automerge.ts';

/**
 * @ext
 */
export type { PatchState } from '@sys/driver-immer/t';

/**
 * @system
 */
export type {
  CBOR,
  CommonTheme,
  Disposable,
  Immutable,
  ImmutableChange,
  ImmutableChangeOptions,
  ImmutableChangeOptionsInput,
  ImmutableEvents,
  ImmutableMap,
  ImmutableMapPatch,
  ImmutableMapping,
  ImmutableMutator,
  ImmutablePatchCallback,
  ImmutableRef,
  Index,
  IODirection,
  Lifecycle,
  Msecs,
  ObjectPath,
  ParsedArgs,
  PickRequired,
  SortOrder,
  StringUri,
  TextDiff,
  TextSplice,
  TimeDuration,
  UnixTimestamp,
  UntilObservable,
} from '@sys/std/t';
export type { ErrorLike, StringHash };

/**
 * TODO 🐷 - rename replacements (tmp)
 */
import type { ErrorLike, StringHash } from '@sys/std/t';
export type Error = ErrorLike; // TODO 🐷
export type HashString = StringHash;

export type {
  Cmd,
  CmdObject,
  CmdPaths,
  CmdPathsObject,
  CmdQueue,
  CmdTestFactory,
  CmdTestSetup,
  CmdTestState,
  CmdTx,
  CmdType,
} from '@sys/cmd/t';

export type { Describe, Expect, It } from '@sys/std/t';


/**
 * @local
 */
export type * from '../types.ts';
