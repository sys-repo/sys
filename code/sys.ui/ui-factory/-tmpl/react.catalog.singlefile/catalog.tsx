/**
 * @module
 * Single-file Catalog entry-point demonstrating:
 *
 * • Slots               parent/child layout with `Left`, `Right`, and nested `Inner` slot.
 * • Schema Validation   strict `PanelSchema` (title:string, count?:integer, body?:string).
 * • Factory             local `regs` composed into a strongly-typed `factory`.
 * • Plan Builder        `makePlan({ mode })` flips between valid/invalid props to test schema enforcement.
 * • Default Export      `plan` as a canonical "hello world" valid example.
 *
 * Use this as a minimal, self-contained starting point for Catalog samples.
 */
import React from 'react';

import { Type } from '@sys/schema';
import { Is } from '@sys/std';
import { Color, css } from '@sys/ui-css';
import { Factory } from '@sys/ui-factory/core';

import type { CommonTheme } from '@sys/types/t';
import type { Plan, ReactRegistration } from '@sys/ui-factory/t';

/**
 * Domain unions for this single-file sample.
 */
type Id = 'Layout:two' | 'Panel:view';
type Slot = 'Left' | 'Right' | 'Inner';

/**
 * Schema: strict and representative.
 * - title: required string
 * - count: optional integer
 * - body: optional string
 * - theme: optional CommonTheme (opaque to schema; carried through runtime)
 */
const PanelSchema = Type.Object({
  title: Type.String(),
  count: Type.Optional(Type.Integer()),
  body: Type.Optional(Type.String()),
});

/**
 * Components.
 */
function TwoColumn(props: {
  Left?: React.ReactNode;
  Right?: React.ReactNode;
  theme?: CommonTheme;
}) {
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12,
      padding: 12,
      borderRadius: 10,
      outline: `1px dashed ${Color.alpha(theme.fg, 0.25)}`,
      background: Color.alpha(theme.bg, 0.04),
    }),
    area: css({
      borderRadius: 10,
      padding: 12,
      outline: `1px dashed ${Color.alpha(theme.fg, 0.25)}`,
      minHeight: 40,
    }),
    label: css({ opacity: 0.6, marginBottom: 8 }),
  };

  return (
    <section className={styles.base.class} data-layout="two">
      <div className={styles.area.class}>
        <div className={styles.label.class}>Left</div>
        {props.Left}
      </div>
      <div className={styles.area.class}>
        <div className={styles.label.class}>Right</div>
        {props.Right}
      </div>
    </section>
  );
}

function Panel(props: {
  title?: string;
  count?: number;
  body?: string;
  Inner?: React.ReactNode;
  theme?: CommonTheme;
}) {
  const wrap = (v: React.ReactNode) => (Is.string(v) ? `"${v}"` : v);
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      border: `dashed 2px ${Color.alpha(theme.fg, 0.45)}`,
      borderRadius: 12,
      padding: 14,
      display: 'grid',
      gap: 6,
      background: Color.alpha(theme.bg, 0.02),
    }),
    title: css({ fontWeight: 700 }),
    body: css({ opacity: 0.7 }),
    code: css({ fontFamily: 'monospace' }),
  };

  return (
    <article className={styles.base.class} data-panel>
      {props.title && <div className={styles.title.class}>{props.title}</div>}
      {props.body && <div className={styles.body.class}>{props.body}</div>}
      <div className={styles.code.class}>{`count = ${wrap(props.count)}`}</div>
      {/* Nested slot is optional; safe when omitted */}
      {props.Inner && <div data-slot="Inner">{props.Inner}</div>}
    </article>
  );
}

/**
 * Registrations (note: schema on Panel).
 */
const regs = [
  {
    spec: { id: 'Layout:two', slots: ['Left', 'Right'] as const },
    load: async () => ({ default: TwoColumn }),
  },
  {
    spec: { id: 'Panel:view', slots: ['Inner'] as const, schema: PanelSchema },
    load: async () => ({ default: Panel }),
  },
] satisfies readonly ReactRegistration<Id, Slot>[];

/**
 * Factory for this single-file sample.
 */
export const factory = Factory.make(regs);

/**
 * Build a plan:
 * - `mode: 'valid' | 'invalid'` toggles props to exercise schema validation.
 * - Left: one Panel (props validated).
 * - Right: array of Panels; second nests a child via 'Inner'.
 */
export function makePlan(
  opts: {
    theme?: CommonTheme;
    mode?: 'valid' | 'invalid';
  } = {},
): Plan<typeof factory> {
  const { theme, mode = 'valid' } = opts;

  // Valid props (pass schema)
  const ok = { title: 'OK', count: 1, body: 'This passes validation', theme };

  // Invalid props (fail schema deliberately)
  // - title should be string, count should be integer; flip both.
  const bad = {
    title: 123 as unknown as string,
    count: 'x' as unknown as number,
    body: 'Invalid sample',
    theme,
  };

  const leftProps = mode === 'invalid' ? bad : ok;

  return {
    root: {
      component: 'Layout:two',
      props: { theme },
      slots: {
        Left: {
          component: 'Panel:view',
          props: leftProps,
        },
        Right: [
          {
            component: 'Panel:view',
            props: { title: 'Right A', count: 2, body: 'Array item (valid)', theme },
          },
          {
            component: 'Panel:view',
            props: { title: 'Right B', count: 3, body: 'Nested content below', theme },
            slots: {
              Inner: {
                component: 'Panel:view',
                props: {
                  title: 'Nested',
                  count: 4,
                  body: 'Rendered inside Right B → Inner',
                  theme,
                },
              },
            },
          },
        ],
      },
    },
  };
}

/**
 * Tiny convenience export for a canonical default (valid) plan.
 */
export const plan: Plan<typeof factory> = makePlan({ mode: 'valid' });
