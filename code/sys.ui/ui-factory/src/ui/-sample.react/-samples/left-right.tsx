import React from 'react';
import { Factory } from '@sys/ui-factory/core';
import { renderPlan } from '@sys/ui-factory/react';
import type { Plan, ReactRegistration } from '@sys/ui-factory/t';

/**
 * Domain unions.
 */
type Id = 'Layout:two' | 'Panel:view';
type Slot = 'Left' | 'Right';

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

function Panel(props: { title?: string; body?: string }) {
  const { title, body } = props;
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
      <div>{body}</div>
    </div>
  );
}

/**
 * Registrations.
 */
const regs = [
  {
    spec: { id: 'Layout:two', slots: ['Left', 'Right'] as const },
    load: async () => ({ default: TwoColumn }),
  },
  {
    spec: { id: 'Panel:view', slots: [] as const },
    load: async () => ({ default: Panel }),
  },
] satisfies readonly ReactRegistration<Id, Slot>[];

/**
 * Factory.
 */
export const factory = Factory.make(regs);

/**
 * Plan.
 */
export const plan: Plan<typeof factory> = {
  root: {
    component: 'Layout:two',
    slots: {
      Left: { component: 'Panel:view', props: { title: 'Left', body: 'Hello from left panel' } },
      Right: {
        component: 'Panel:view',
        props: { title: 'Right', body: 'And greetings from the right panel' },
      },
    },
  },
};
