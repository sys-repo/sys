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
  StrBuilder,
  Timecode,
} from '@sys/std/t';

/** @system: Common */
export type {
  CliFormatHelpInput,
  CliFormatHelpInputSections,
  CliFormatHelpInputShorthand,
  CliFormatHelpOption,
  CliFormatHelpPair,
  CliFormatHelpSection,
  CliFormatHelpTone,
  CliTable,
  MenuResult,
  MenuResultKind,
} from '@sys/cli/t';
export type { ColorTheme } from '@sys/color/t';
export type { FileMap, FileMapProcessor, JsonFile, JsonFileDoc, WalkEntry } from '@sys/fs/t';
export type { HonoMiddlewareHandler, HttpPullEvent, HttpPullToDirResult } from '@sys/http/t';
export type { Graph } from '@sys/immutable/t';
export type { Process } from '@sys/process/t';
export type { Schema } from '@sys/schema/t';
export type { SpecImports, TestingDir } from '@sys/testing/t';
export type { Yaml, YamlConfig } from '@sys/yaml/t';

/** @system: UI */
export type { CssEdgesInput, CssInput, CssMarginArray, CssProps, CssValue } from '@sys/ui-css/t';
export type { KeyboardModifierFlags } from '@sys/ui-dom/t';
export type { DevCtx } from '@sys/ui-react-devharness/t';

/** @system: Drivers */
export type { Crdt, CrdtRepoWireEvent } from '@sys/driver-automerge/t';

/**
 * @local
 */
export type * from '../-tmpl.cli/t.ts';
export type * from '../t.ts';

export type * from '../cli.clipboard/t.ts';
export type * from '../cli.code/t.ts';
export type * from '../cli.crdt/t.ts';
export type * from '../cli.deploy/t.ts';
export type * from '../cli.serve/t.ts';
export type * from '../cli.update/t.ts';
export type * from '../cli.video/t.ts';
export type * from '../cli.pull/t.ts';
export type * from '../cli.crypto/t.ts';
export type * from '../cli.tmpl/t.ts';
