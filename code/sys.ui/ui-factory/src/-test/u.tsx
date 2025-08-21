import React from 'react';
import { type t } from './common.ts';

/**
 * Silent stub: renders a React element with testable attributes.
 */
export const stubView = (name: string): t.LazyViewModule => {
  const Comp: React.FC<unknown> = (props) => (
    <div data-stub-view={name} data-props={JSON.stringify(props)} />
  );
  (Comp as any).displayName = name;
  return { default: Comp };
};

/**
 * Registration helper.
 * - Back-compat: default `slots` = [] (matches your current tests).
 * - When writing slot-related tests, pass `slots` explicitly.
 */
export const reg = <TId extends string, TSlot extends string = string>(
  id: TId,
  slots: TSlot[] = [],
): t.Registration<TId> => {
  return {
    spec: { id, slots },
    load: async () => stubView(id),
  };
};
