import React from 'react';
import { type t, Color, css, Factory } from '../common.ts';

/**
 * Domain unions (include both local and "external" ids).
 */
type Id = 'Split:view' | 'Panel:view' | string;
type Slot = 'Left' | 'Right';

/**
 * Components.
 */
function Split(props: {
  Left?: React.ReactNode;
  Right?: React.ReactNode;
  label?: string;
  theme?: t.CommonTheme;
}) {
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      fontSize: 12,
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 12,
      padding: 12,
      borderRadius: 10,
      background: Color.alpha(theme.bg, 0.05),
      outline: `1px dashed ${Color.alpha(theme.fg, 0.25)}`,
    }),
    col: css({
      borderRadius: 10,
      padding: 12,
      outline: `1px dashed ${Color.alpha(theme.fg, 0.25)}`,
      minHeight: 40,
    }),
    label: css({ opacity: 0.6, marginBottom: 8 }),
  };

  return (
    <section className={styles.base.class}>
      <div className={styles.col.class}>
        <div className={styles.label.class}>Left{props.label ? ` • ${props.label}` : ''}</div>
        {props.Left}
      </div>
      <div className={styles.col.class}>
        <div className={styles.label.class}>Right{props.label ? ` • ${props.label}` : ''}</div>
        {props.Right}
      </div>
    </section>
  );
}

function Panel(props: { title?: string; body?: string; theme?: t.CommonTheme }) {
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      padding: 12,
      borderRadius: 10,
      outline: `1px dashed ${Color.alpha(theme.fg, 0.25)}`,
      display: 'grid',
      gap: 6,
    }),
    title: css({ fontWeight: 700, opacity: 1 }),
    body: css({ opacity: 0.35, lineHeight: 1.25 }),
    meta: css({ opacity: 0.6 }),
  };

  return (
    <article className={styles.base.class} data-panel>
      {props.title && <div className={styles.title.class}>{props.title}</div>}
      {props.body ? <div className={styles.body.class}>{props.body}</div> : null}
    </article>
  );
}

/**
 * Local registrations.
 */
const regs = [
  {
    spec: { id: 'Split:view', slots: ['Left', 'Right'] as const },
    load: async () => ({ default: Split }),
  },
  {
    spec: { id: 'Panel:view', slots: [] as const },
    load: async () => ({ default: Panel }),
  },
] satisfies readonly t.ReactRegistration<Id, Slot>[];

/** Local base factory (may be composed with a sub-factory). */
export const baseFactory = Factory.make(regs);

let composedFactory: t.Factory<any, any>;

/**
 * Recursively construct a plan subtree.
 * We narrow only the `component` id at each step; everything else is inferred.
 */
function node<F extends t.Factory<any, any>>(
  depth: number,
  label: string,
  theme: t.CommonTheme | undefined,
): t.Plan<F>['root'] {
  // Literal ids we use in this module, typed to the factory’s id space.
  type SplitId = Extract<t.ViewIds<F>, 'Split:view'>;
  type PanelId = Extract<t.ViewIds<F>, 'Panel:view'>;

  if (depth <= 0) {
    const id = 'Panel:view' as PanelId;
    return {
      component: id,
      props: { title: 'Leaf', body: `depth 0 (${label})`, theme },
    };
  }

  const id = 'Split:view' as SplitId;
  const left = node<F>(depth - 1, `${label}.L`, theme);
  const right = node<F>(depth - 1, `${label}.R`, theme);

  // Cast only the slots object to the correct mapped type for this id.
  const slots = {
    Left: left,
    Right: right,
  } as unknown as {
    [K in t.SlotsFor<F, SplitId>]: t.PlanNode<F> | readonly t.PlanNode<F>[];
  };

  return {
    component: id,
    props: { label, theme },
    slots,
  };
}

/**
 * Compose base + optional sub-factory, and build a recursive plan.
 */
export function makeComposite(
  subFactory?: t.Factory<any, any>,
  depth: number = 2,
  theme?: t.CommonTheme,
): { factory: typeof composedFactory; plan: t.Plan<typeof composedFactory> } {
  composedFactory = subFactory ? Factory.compose([baseFactory, subFactory]) : baseFactory;

  type F = typeof composedFactory;
  const root = node<F>(depth, 'root', theme);
  const plan: t.Plan<F> = { root };

  return {
    factory: composedFactory,
    plan,
  };
}
