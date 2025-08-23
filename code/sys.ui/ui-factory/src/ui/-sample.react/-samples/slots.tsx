import { Factory } from '@sys/ui-factory/core';
import type { Plan, ReactRegistration } from '@sys/ui-factory/t';
import React from 'react';

import { type t, Color, css } from '../common.ts';

/**
 * Domain unions.
 * - Include 'Inner' because Panel exposes a nested slot.
 */
type Id = 'Layout:two' | 'Panel:view';
type Slot = 'Left' | 'Right' | 'Inner';

/**
 * Components (pulled out for clarity).
 */
function TwoColumn(props: {
  Left?: React.ReactNode;
  Right?: React.ReactNode;
  theme?: t.CommonTheme;
}) {
  const { Left, Right } = props;

  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(true),
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12,
    }),
    left: css({
      backgroundColor: Color.ruby(true),
    }),
  };

  return (
    <section data-layout="two" className={styles.base.class}>
      <aside data-slot="Left" className={styles.left.class}>
        {Left}
      </aside>
      <main data-slot="Right">{Right}</main>
    </section>
  );
}

function Panel(props: {
  title?: string;
  body?: string;
  Inner?: React.ReactNode;
  theme?: t.CommonTheme;
}) {
  const { title, body, Inner } = props;
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      border: `dashed 2px ${Color.alpha(theme.fg, 0.5)}`,
      borderRadius: 12,
      padding: 12,
      margin: 12,
    }),
  };

  return (
    <div data-panel className={styles.base.class} style={{}}>
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
export function makePlan(props: { theme: t.CommonTheme | undefined }): Plan<typeof factory> {
  const { theme } = props;
  const plan: Plan<typeof factory> = {
    root: {
      component: 'Layout:two',
      slots: {
        Left: {
          component: 'Panel:view',
          props: { title: 'Left', body: 'Hello from left panel', theme },
        },
        Right: [
          {
            component: 'Panel:view',
            props: { title: 'Right A', body: 'Item A', theme },
          },
          {
            component: 'Panel:view',
            props: { title: 'Right B', body: 'Item B (with nested content)', theme },
            slots: {
              Inner: {
                component: 'Panel:view',
                props: { title: 'Nested', body: 'Rendered inside Right B → Inner', theme },
              },
            },
          },
        ],
      },
    },
  };
  return plan;
}
