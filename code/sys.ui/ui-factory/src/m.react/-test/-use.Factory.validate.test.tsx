import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { type t, describe, expect, it, Obj } from '../../-test.ts';

import { Type } from '@sys/schema';
import { Factory } from '@sys/ui-factory/core';
import { useFactory } from '@sys/ui-factory/react';
import { Schema } from '@sys/ui-factory/schema';
import type { Plan, ReactRegistration } from '@sys/ui-factory/t';

/**
 * Validation-focused setup kept separate from the basic “Hello” tests.
 */
type Id = 'Layout:two' | 'Panel:view';
type Slot = 'Left' | 'Right';

const PanelSchema = Type.Object({
  title: Type.String(),
  count: Type.Optional(Type.Integer()),
});

const regs = [
  {
    spec: { id: 'Layout:two', slots: ['Left', 'Right'] as const },
    load: async () => ({ default: TwoCol }),
  },
  {
    spec: { id: 'Panel:view', slots: [] as const, schema: PanelSchema },
    load: async () => ({ default: Panel }),
  },
] satisfies readonly ReactRegistration<Id, Slot>[];

const factory = Factory.make(regs);
type F = typeof factory;
const validators = Schema.Props.makeValidators(regs);

describe('hook: useFactory - validation', () => {
  it('validate: false → no validation (no callbacks)', () => {
    const plan: Plan<F> = {
      root: {
        component: 'Layout:two',
        slots: {
          Left: { component: 'Panel:view', props: { title: 'ok', count: 1 } },
          Right: { component: 'Panel:view', props: { title: 123 } as any }, // invalid but ignored
        },
      },
    };

    const calls: string[] = [];
    function Harness() {
      useFactory(factory, plan, { strategy: 'eager', validate: false });
      calls.push('ran');
      return null;
    }

    const html = ReactDOMServer.renderToStaticMarkup(<Harness />);
    expect(html).to.equal('');
    expect(calls.length).to.equal(1);
  });

  it('validate: true → reports errors via onError/onErrors', () => {
    const plan: Plan<F> = {
      root: {
        component: 'Layout:two',
        slots: {
          Left: { component: 'Panel:view', props: { title: 'ok' } },
          Right: { component: 'Panel:view', props: { title: 123, count: 'x' } as any }, // ← two errors.
        },
      },
    };

    const each: string[] = [];
    let batch: string[] | undefined;

    function Harness() {
      useFactory(factory, plan, {
        strategy: 'eager',
        validate: {
          mode: 'always',
          validators,
          onError: (e) => each.push(`${e.id}${Obj.Path.encode(e.path)}`),
          onErrors: (errs) => (batch = errs.map((e) => Obj.Path.encode(e.path))),
        },
      });
      return null;
    }

    ReactDOMServer.renderToStaticMarkup(<Harness />);

    expect(each.length).to.be.greaterThan(0);
    expect(each.some((p) => p.startsWith('Panel:view/title'))).to.eql(true);
    expect(each.some((p) => p.startsWith('Panel:view/count'))).to.eql(true);

    expect(batch).to.not.equal(undefined);
    expect(batch!).to.include('/title');
    expect(batch!).to.include('/count');
  });

  it('failFast: true → stops after first error', () => {
    const plan: Plan<F> = {
      root: {
        component: 'Layout:two',
        slots: {
          Left: { component: 'Panel:view', props: { title: 999 } as any }, // invalid
          Right: { component: 'Panel:view', props: { title: 123, count: 'x' } as any }, // invalid too
        },
      },
    };

    const paths: string[] = [];
    function Harness() {
      useFactory(factory, plan, {
        strategy: 'eager',
        validate: {
          mode: 'always',
          validators,
          failFast: true,
          onError: (e) => paths.push(Obj.Path.encode(e.path)),
        },
      });
      return null;
    }

    ReactDOMServer.renderToStaticMarkup(<Harness />);
    expect(paths.length).to.equal(1);
  });

  it('validates nested slots (deep traversal)', () => {
    const plan: Plan<F> = {
      root: {
        component: 'Layout:two',
        slots: {
          Left: { component: 'Panel:view', props: { title: 'ok' } },
          Right: {
            component: 'Layout:two',
            slots: {
              Left: { component: 'Panel:view', props: { title: 42 } as any }, // invalid deep
              Right: { component: 'Panel:view', props: { title: 'ok' } },
            },
          } as any,
        },
      },
    };

    const seen: string[] = [];
    function Harness() {
      useFactory(factory, plan, {
        strategy: 'eager',
        validate: {
          mode: 'always',
          validators,
          onError: (e) => seen.push(Obj.Path.encode(e.path)),
        },
      });
      return null;
    }

    ReactDOMServer.renderToStaticMarkup(<Harness />);
    expect(seen.some((p) => p.endsWith('/title'))).to.eql(true);
  });

  it('validate option variants (shorthand + object)', () => {
    // Invalid plan so that when validation runs it definitely produce errors.
    const badPlan: Plan<F> = {
      root: {
        component: 'Panel:view',
        props: { title: 123, count: 'x' }, // ← NB: count not a number.
      },
    };

    type T = { label: string; validate: t.UseFactoryValidate; expectHits: number };
    function test(args: T): number {
      const { validate } = args;
      let hits = 0;

      function Harness() {
        let v: t.UseFactoryValidate;

        if (typeof validate === 'object') {
          v = { ...validate, onError: () => hits++ };
        } else if (validate === true || validate === 'always') {
          // mimic wrangle's derivation + add onError so we can observe errors
          v = { mode: 'always', validators, onError: () => hits++ };
        } else {
          v = validate; // false → never
        }

        useFactory(factory, badPlan, { strategy: 'eager', validate: v });
        return null;
      }

      ReactDOMServer.renderToStaticMarkup(<Harness />);
      expect(hits).to.eql(args.expectHits);
      return hits;
    }

    test({
      label: 'shorthand "always" (no validators provided)',
      validate: 'always',
      expectHits: 2,
    });
    test({
      label: 'shorthand true (no validators provided)',
      validate: true,
      expectHits: 2,
    });
    test({
      label: 'shorthand false',
      validate: false,
      expectHits: 0,
    });
    test({
      label: 'object form with validators (mode:"always")',
      validate: { mode: 'always', validators },
      expectHits: 2,
    });
  });
});

/**
 * Helper Components:
 */
function TwoCol(props: { Left?: React.ReactNode; Right?: React.ReactNode }) {
  return (
    <section data-two>
      <aside data-left>{props.Left}</aside>
      <main data-right>{props.Right}</main>
    </section>
  );
}

function Panel(props: { title: string; count?: number }) {
  return (
    <article data-panel>
      <strong>{props.title}</strong>
      {props.count != null && <span data-count>{props.count}</span>}
    </article>
  );
}
