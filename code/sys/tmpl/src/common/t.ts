/**
 * @external
 */
export type { ReactElement, ReactNode } from 'react';

/**
 * @system
 */
export type * from '@sys/types';

export type { ColorTheme } from '@sys/color/t';
export type { FileMap, FileMapFilterArgs, FileMapProcessor } from '@sys/fs/t';
export type { SpecImports, TestingDir } from '@sys/testing/t';
export type { TmplFilter } from '@sys/tmpl-engine/t';

/**
 * @local
 */
export type * from '../types.ts';
