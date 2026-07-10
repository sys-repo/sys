/**
 * @external
 */
export type { FC, ReactElement, ReactNode } from 'react';

/**
 * @system
 */
export type * from '@sys/types';
export type { Cli } from '@sys/cli/t';
export type { FileMap } from '@sys/fs/t';
export type { Process } from '@sys/process/t';
export type { Tmpl, TmplProcessFile } from '@sys/tmpl-engine/t';
export type { Yaml } from '@sys/yaml/t';

/** User-interface: */
export type { Color } from '@sys/color/t';
export type { SpecImports, TestingDir } from '@sys/testing/t';
export type { Keyboard } from '@sys/ui-dom/t';
export type { DevCtx } from '@sys/ui-dev/react/devharness/t';

/**
 * @local
 */
export type * from '../types.ts';
