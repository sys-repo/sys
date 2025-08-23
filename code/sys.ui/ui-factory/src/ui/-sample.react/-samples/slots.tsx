import React from 'react';
import { Factory } from '@sys/ui-factory/core';
import { renderPlan } from '@sys/ui-factory/react';
import type { Plan, ReactRegistration } from '@sys/ui-factory/t';

/**
 * Domain unions.
 * - Include 'Inner' because Panel exposes a nested slot.
 */
type Id = 'Layout:two' | 'Panel:view';
type Slot = 'Left' | 'Right' | 'Inner';

/**
 * Components (pulled out for clarity).
 */
function TwoColumn(props: { Left?: React.ReactNode; Right?: React.ReactNode }) {
  const { Left, Right } = props;
  return (
    <section
      data-layout="two"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
        alignItems: 'start',
      }}
    >
      <aside data-slot="Left">{Left}</aside>
      <main data-slot="Right">{Right}</main>
    </section>
  );
}

function Panel(props: { title?: string; body?: string; Inner?: React.ReactNode }) {
  const { title, body, Inner } = props;
  return (
    <div
      data-panel
      style={{
        border: '1px solid rgba(0,0,0,0.15)',
        borderRadius: 8,
        padding: 12,
      }}
    >
      {title && <div style={{ fontWeight: 600, marginBottom: 6 }}>{title}</div>}
      {body && <div style={{ marginBottom: 8 }}>{body}</div>}
      {/* Nested slot: optional, safe when omitted */}
      {Inner && <div data-slot="Inner">{Inner}</div>}
    </div>
  );
}

/**
 * Registrations.
 * - Panel exposes an 'Inner' slot (for nesting).
 */
const regs = [
  {
    spec: { id: 'Layout:two', slots: ['Left', 'Right'] as const },
    load: async () => ({ default: TwoColumn }),
  },
  {
    spec: { id: 'Panel:view', slots: ['Inner'] as const },
    load: async () => ({ default: Panel }),
  },
] satisfies readonly ReactRegistration<Id, Slot>[];

/** Factory. */
export const factory = Factory.make(regs);

/**
 * Plan.
 * - Left: single Panel.
 * - Right: array of Panels (order preserved). Second Panel nests a child via its 'Inner' slot.
 * - Omit 'Inner' elsewhere to demonstrate that empty slots are safe.
 */
export const plan: Plan<typeof factory> = {
  root: {
    component: 'Layout:two',
    slots: {
      Left: { component: 'Panel:view', props: { title: 'Left', body: 'Hello from left panel' } },
      Right: [
        {
          component: 'Panel:view',
          props: { title: 'Right A', body: 'Item A' },
        },
        {
          component: 'Panel:view',
          props: { title: 'Right B', body: 'Item B (with nested content)' },
          slots: {
            Inner: {
              component: 'Panel:view',
              props: { title: 'Nested', body: 'Rendered inside Right B → Inner' },
            },
          },
        },
      ],
    },
  },
};
