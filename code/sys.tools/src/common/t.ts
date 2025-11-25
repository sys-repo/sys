import { exitCode } from 'node:process';

/**
 * @external
 */
export type { ReactElement, ReactNode } from 'react';

/**
 * @system
 */
export type * from '@sys/types';

export type { CliTable } from '@sys/cli/t';
export type { ColorTheme } from '@sys/color/t';
export type { WalkEntry, JsonFileDoc, JsonFile } from '@sys/fs/t';
export type { ProcOutput } from '@sys/process/t';
export type { AnsiColors } from '@sys/std/t';
export type { SpecImports, TestingDir } from '@sys/testing/t';
export type { HonoMiddlewareHandler } from '@sys/http/t';

export type { CssEdgesInput, CssInput, CssMarginArray, CssProps, CssValue } from '@sys/ui-css/t';
export type { KeyboardModifierFlags } from '@sys/ui-dom/t';
export type { DevCtx } from '@sys/ui-react-devharness/t';

export type { Crdt } from '@sys/driver-automerge/t';

/**
 * @local
 */
export type * from '../types.ts';
