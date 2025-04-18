/**
 * @external
 */
import { signal, useSignal, useSignalEffect, effect } from '@preact/signals-react';
export const Signal = {
  signal,
  effect,
  useSignal,
  useSignalEffect,
} as const;

/**
 * @system
 */
export { Color, css, Style } from '@sys/ui-css';
export * from '../common.ts';
