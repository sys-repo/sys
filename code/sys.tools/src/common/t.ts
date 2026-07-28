/**
 * @external
 */
export type { ReactElement, ReactNode } from 'react';

/**
 * @system
 */
export type * from '@sys/types';

/** @system: Standard */
export type {
  Alias,
  AnsiColors,
  ArgsAliasMap,
  Logger,
  ParsedArgs,
  Str,
  Timecode,
} from '@sys/std/t';

/** @system: Common */
export type { Cli, CliInput, Shell } from '@sys/cli/t';
export type { Color } from '@sys/color/t';
export type { FileMap, JsonFile, WalkEntry } from '@sys/fs/t';
export type { HonoMiddlewareHandler, HttpPullEvent, HttpPullToDirResult } from '@sys/http/t';
export type { Graph } from '@sys/immutable/t';
export type { Process } from '@sys/process/t';
export type { Schema } from '@sys/schema/t';
export type { SpecImports, TestingDir } from '@sys/testing/t';
export type { Yaml, YamlConfig } from '@sys/yaml/t';

/** @system: UI */
export type { Keyboard } from '@sys/ui-dom/t';
export type { DevCtx } from '@sys/ui-dev/react/devharness/t';

/** @system: Drivers */
export type { Crdt, CrdtRepoWireEvent } from '@sys/driver-automerge/t';

/**
 * @local
 */
export type * from '../-tmpl.cli/t.ts';
export type * from '../t.ts';

export type * from '../cli.clipboard/t.ts';
export type * from '../cli.crdt/t.ts';
export type * from '../cli.crypto/t.ts';
export type * from '../cli.deploy/t.ts';
export type * from '../cli.pi/t.ts';
export type * from '../cli.pull/t.ts';
export type * from '../cli.serve/t.ts';
export type * from '../cli.shell/t.ts';
export type * from '../cli.tmpl/t.ts';
export type * from '../cli.upgrade/t.ts';
export type * from '../cli.video/t.ts';
export type * from '../m.help/t.ts';
