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
    // Normalize to either a single node or an array of nodes.
    p.slots[slot] = Array.isArray(child) ? [...(child as any[])] : child;
  },

  update() {
    /* noop (v1: mount-only) */
  },
  remove() {
    /* noop (v1: mount-only) */
  },

  finalize(root) {
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

/**
 * Convert a host node → React element.
 * - Defensive to nullish / unexpected shapes.
 * - Preserves existing keys; generates stable fallback keys for arrays.
 * - Allows raw React elements to flow through (just in case).
 */
function toEl(n: any): React.ReactElement {
  // Pass through raw React elements untouched.
  if (React.isValidElement(n)) return n;

  // Defensive: null/undefined guard (shouldn’t happen in well-formed plans).
  if (!n) {
    // Create a benign placeholder to keep return type as ReactElement.
    return React.createElement(React.Fragment);
  }

  // Expect the normalized host node shape from `create`.
  const C = n.Component as React.ComponentType<any> | undefined;
  if (typeof C !== 'function') {
    throw new Error('HostAdapter: invalid node (missing Component).');
  }

  const slotProps: Record<string, unknown> = {};

  for (const [slotName, v] of Object.entries(n.slots ?? {})) {
    if (v == null) continue; // Ignore null/undefined slots (cleaner props)

    if (Array.isArray(v)) {
      // Map children → elements, preserving keys or generating fallbacks.
      const items = (v as any[])
        .filter(Boolean)
        .map((child, i) => ensureKey(toEl(child), `${slotName}:${i}`));

      // Only assign the prop if there’s something to render
      if (items.length > 0) slotProps[slotName] = items;
    } else {
      slotProps[slotName] = toEl(v);
    }
  }

  // Merge original props with slot props (slots last so they can override intentionally).
  return React.createElement(C, { ...(n.props as any), ...slotProps });
}

/**
 * Ensures an element has a key when used in an array context.
 * If it already has a key, leave it alone.
 */
function ensureKey(el: React.ReactElement, fallback: React.Key) {
  return el.key == null ? React.cloneElement(el, { key: fallback }) : el;
}
