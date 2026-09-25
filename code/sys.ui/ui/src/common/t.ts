/**
 * @external
 */
export type { FC, ReactNode } from 'react';

/**
 * @system
 */
export type * from '@sys/types';
export type { Files as ModelFiles } from '@sys/model/files/t';

/** User-interface: */
export type { Color } from '@sys/color/t';
export type { SpecImports } from '@sys/testing/t';
export type { Style } from '@sys/ui-css/t';
export type { KeyValue } from '@sys/ui-components/t';

/**
 * @local
 */
export type * from '../types.ts';
