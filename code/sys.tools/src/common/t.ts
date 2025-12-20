/**
 * @external
 */
export type { ReactElement, ReactNode } from 'react';

/**
 * @system
 */
export type * from '@sys/types';

/** @system: Standard */
export type { Alias, AnsiColors, ParsedArgs, StrBuilder, Timecode } from '@sys/std/t';

/** @system: Common */
export type { CliTable } from '@sys/cli/t';
export type { ColorTheme } from '@sys/color/t';
export type { FileMap, JsonFile, JsonFileDoc, WalkEntry } from '@sys/fs/t';
export type { HonoMiddlewareHandler, HttpPullEvent, HttpPullToDirResult } from '@sys/http/t';
export type { Graph } from '@sys/immutable/t';
export type { ProcOutput } from '@sys/process/t';
export type { SpecImports, TestingDir } from '@sys/testing/t';
export type { Yaml } from '@sys/yaml/t';

/** @system: UI */
export type { CssEdgesInput, CssInput, CssMarginArray, CssProps, CssValue } from '@sys/ui-css/t';
export type { KeyboardModifierFlags } from '@sys/ui-dom/t';
export type { DevCtx } from '@sys/ui-react-devharness/t';

/** @system: Drivers */
export type { Crdt, CrdtRepoWireEvent } from '@sys/driver-automerge/t';

/**
 * @local
 */
export type * from '../t.namespace.ts';
export type * from '../-tmpl/t.ts';
export type * from '../-tmpl.cli/t.ts';
export type * from '../cli.clipboard/t.ts';
export type * from '../cli.crdt/t.ts';
export type * from '../cli.deploy/t.ts';
export type * from '../cli.fs/t.ts';
export type * from '../cli.serve/t.ts';
export type * from '../cli.update/t.ts';
export type * from '../cli.video/t.ts';
