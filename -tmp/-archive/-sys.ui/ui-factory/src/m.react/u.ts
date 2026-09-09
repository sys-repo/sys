import React from 'react';
import { type t } from './common.ts';

export function asReactInstance(instance: t.HostInstance): { element: React.ReactElement } {
  const anyInst = instance as any;
  if (!anyInst || !React.isValidElement(anyInst.element)) {
    throw new Error('Not a React HostInstance');
  }
  return { element: anyInst.element };
}
