import type { Plan, ReactRegistration } from '@sys/ui-factory/t';
import React from 'react';

import { Type } from '@sys/schema';
import { Factory } from '@sys/ui-factory/core';
import { type t, Color, css, Is, ObjectView } from '../common.ts';

type Id = 'Panel:view';
type Slot = never;

/**
 * Schema (simple and strict).
 */
const PanelSchema = Type.Object({
  title: Type.String(),
  count: Type.Optional(Type.Integer()),
});

/**
 * View:
 */
function Panel(props: { title?: string; count?: number; theme?: t.CommonTheme }) {
  const wrap = (value: React.ReactNode) => (Is.string(value) ? `"${value}"` : value);
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ position: 'relative', display: 'grid', placeItems: 'center', lineHeight: '2.3em' }),
    body: css({ fontSize: 26, fontFamily: 'monospace', minWidth: 260 }),
  };
  return (
    <div className={styles.base.class}>
      <div className={styles.body.class}>
        <div>{`title = ${wrap(props.title)}`}</div>
        <div>{`count = ${wrap(props.count)}`}</div>
      </div>
    </div>
  );
}

/**
 * Registrations (note: spec.schema is set)
 */
const regs = [
  {
    spec: { id: 'Panel:view', slots: [] as const, schema: PanelSchema },
    load: async () => ({ default: Panel }),
  },
] satisfies readonly ReactRegistration<Id, Slot>[];

/**
 * Factory.
 */
export const factory = Factory.make(regs);

/**
 * Plan builder: flip between valid/invalid props.
 */
export function makePlan(invalid: boolean, theme?: t.CommonTheme): Plan<typeof factory> {
  const good = { theme, title: 'hello', count: 1 };
  const bad = { theme, title: 123, count: 'x' };
  const props = invalid ? bad : good;
  return {
    root: { component: 'Panel:view', props },
  };
}
