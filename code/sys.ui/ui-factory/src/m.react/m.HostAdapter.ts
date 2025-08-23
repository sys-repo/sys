import React from 'react';
import { type t } from './common.ts';

export const HostAdapter: t.HostAdapter<any> = {
  create(resolved) {
    const mod = resolved.module;
    if (!isReactModule(mod)) {
      throw new Error(`Invalid React module for '${String(resolved.component)}'`);
    }
    const node = {
      Component: mod.default,
      props: resolved.props,
      slots: {} as Record<string, unknown>,
    };
    return node as unknown as t.HostNode;
  },

  insert(parent, slot, child) {
    const p = parent as unknown as { slots: Record<string, unknown> };
    p.slots[slot] = Array.isArray(child) ? [...(child as any[])] : child;
  },

  update() {
    /* noop */
  },
  remove() {
    /* noop */
  },

  finalize(root) {
    const toEl = (n: any): React.ReactElement => {
      const slotProps: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(n.slots ?? {})) {
        slotProps[k] = Array.isArray(v) ? (v as any[]).map(toEl) : toEl(v);
      }
      return React.createElement(n.Component, { ...(n.props as any), ...slotProps });
    };
    const element = toEl(root as any);
    return { element } as unknown as t.HostInstance;
  },
};

/**
 * Helpers:
 */
function isReactModule(m: unknown): m is t.ReactModule {
  return !!m && typeof (m as any).default === 'function';
}
