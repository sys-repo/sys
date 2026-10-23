/**
 * @external
 */
export type { ReactElement, ReactNode } from 'react';

/**
 * @system
 */
export type * from '@sys/types';

export type { Cli } from '@sys/cli/t';
export type { Color } from '@sys/color/t';
export type { FileMap } from '@sys/fs/t';
export type { SpecImports, TestingDir } from '@sys/testing/t';
export type { TmplFilter, TmplWriteResult } from '@sys/tmpl-engine/t';

/**
 * @local
 */
export type { TemplateName } from '../m.Templates.ts';
export type * from '../types.ts';
