// @ts-types="@types/react"
import React from 'react';
import { TestSample, describe, expect, it, type t } from '../../-test.ts';
import { DEFAULTS, Id } from './common.ts';
import { Context } from './mod.ts';

const HOST = DEFAULTS.props.host;
const SUBJECT = DEFAULTS.props.subject;

export function expectRendererId(value?: string) {
  expect(value?.startsWith(Id.renderer.prefix)).to.eql(true);
}

describe(
  'Context',

  /**
   * Timers from RXJS scheduler.
   */
  { sanitizeExit: false, sanitizeOps: false, sanitizeResources: false },

  () => {
    describe('lifecycle', () => {
      it('init', async () => {
        const { events, instance } = TestSample.controller();
        const info = await events.info.get();
        expect(info.render.props).to.eql(undefined); // Initially no render-props data.

        const context = await Context.init(instance);
        expect(context.instance).to.equal(instance);
        expect(context.disposed).to.eql(false);
        expect(context.pending).to.eql(false);

        context.dispose();
        events.dispose();
      });

      it('init ← with {env} ', async () => {
        const { events, instance } = TestSample.controller();

        const env = { foo: 'bar' };
        const context1 = await Context.init(instance, { env });
        const context2 = await Context.init(instance);
        expect(context1.ctx.env).to.eql(env);
        expect(context2.ctx.env).to.eql(undefined);

        context1.dispose();
        context2.dispose();
        events.dispose();
      });

      it('dispose (context)', async () => {
        const { dispose, context, events } = await TestSample.context();

        let fired = 0;
        events.dispose$.subscribe(() => fired++);
        context.dispose$.subscribe(() => fired++);

        dispose();
        expect(fired).to.eql(2);
        expect(context.disposed).to.eql(true);
      });

      it('dispose (ctx)', async () => {
        const { dispose, ctx } = await TestSample.context();

        let fired = 0;
        ctx.dispose$.subscribe(() => fired++);

        dispose();
        expect(fired).to.eql(1);
      });

      it('toObject', async () => {
        const { dispose, context, events } = await TestSample.context();

        const obj = context.toObject();
        const info = await events.info.get();

        expect(obj).to.eql(context.ctx.toObject());
        expect(obj).to.not.equal(context.ctx.toObject());
        expect(obj.id).to.eql(info.instance.session);
        expect(obj.instance).to.equal(context.instance);

        dispose();
      });
    });

    describe('modify => flush', () => {
      it('updates appear in bus/tree after flush', async () => {
        const { events, context, dispose } = await TestSample.context();

        const info1 = await events.info.get();
        expect(info1.render.props).to.eql(undefined); // NB: Initially no render-props data.
        expect(context.pending).to.eql(false);

        const ctx = context.ctx;
        ctx.subject.backgroundColor(-0.3);

        const info2 = await events.info.get();
        expect(info2.render.props).to.eql(undefined); // NB: Not flushed yet.
        expect(context.pending).to.eql(true);

        await context.flush();

        const info3 = await events.info.get();
        expect(info3.render.props?.subject.backgroundColor).to.eql(-0.3);
        expect(context.pending).to.eql(false);

        ctx.subject.backgroundColor(null).color(null);
        await context.flush();

        const info4 = await events.info.get();
        expect(info4.render.props?.subject.backgroundColor).to.eql(SUBJECT.backgroundColor);
        expect(info4.render.props?.subject.color).to.eql(SUBJECT.color);

        dispose();
      });

      it('synced between instances on same bus (single source of truth)', async () => {
        const { instance } = await TestSample.controller();
        const context1 = await Context.init(instance);
        const context2 = await Context.init(instance);

        context1.ctx.subject.backgroundColor(-0.1);
        await context1.flush();

        // NB: Only one of the context has been flushed. Both yield the same updated data.
        expect(context1.toObject().props.subject.backgroundColor).to.eql(-0.1);
        expect(context2.toObject().props.subject.backgroundColor).to.eql(-0.1);

        context1.dispose();
        context2.dispose();
      });
    });

    describe('props.subject', () => {
      it('subject', async () => {
        const { events, context, dispose } = await TestSample.context();
        const ctx = context.ctx;

        const fn = () => null;
        ctx.subject.backgroundColor(-0.2).display('flex').size([10, 20]).render(fn);

        expect(context.pending).to.eql(true);
        await context.flush();
        expect(context.pending).to.eql(false);

        const info = await events.info.get();
        const subject = info.render.props?.subject!;

        expect(subject.backgroundColor).to.eql(-0.2);
        expect(subject.display).to.eql('flex');
        expect(subject.renderer?.fn).to.eql(fn);
        expectRendererId(subject.renderer?.id);
        expect(subject.size).to.eql({ mode: 'center', width: 10, height: 20 });
        dispose();
      });

      it('subject.size', async () => {
        const { events, context, dispose } = await TestSample.context();
        const ctx = context.ctx;

        const test = async (
          expected: t.DevRenderSize | undefined,
          modify: (size: t.DevCtxSubject['size']) => void,
        ) => {
          modify(ctx.subject.size);
          await context.flush();
          const info = await events.info.get();
          const value = info.render.props?.subject.size;
          expect(value).to.eql(expected);
        };

        await test({ mode: 'center', width: 10, height: 20 }, (size) => size([10, 20]));
        await test({ mode: 'center', width: undefined, height: 20 }, (size) =>
          size([undefined, 20]),
        );
        await test({ mode: 'center', width: 10, height: undefined }, (size) =>
          size([10, undefined]),
        );
        await test({ mode: 'center', width: undefined, height: 100 }, (size) => size([null, 100]));
        await test({ mode: 'center', width: 200, height: undefined }, (size) => size([200, null]));

        await test(undefined, (size) => size([null, null]));
        await test(undefined, (size) => size([undefined, null]));
        await test(undefined, (size) => size([null, undefined]));

        const margin = [50, 50, 50, 50] as t.CssMarginArray;
        await test({ mode: 'fill', x: true, y: true, margin }, (size) => size('fill'));
        await test({ mode: 'fill', x: true, y: false, margin }, (size) => size('fill-x'));
        await test({ mode: 'fill', x: false, y: true, margin }, (size) => size('fill-y'));

        await test({ mode: 'fill', x: true, y: true, margin: [10, 10, 10, 10] }, (size) =>
          size('fill', 10),
        );

        await test({ mode: 'fill', x: true, y: true, margin: [1, 2, 3, 4] }, (size) =>
          size('fill', [1, 2, 3, 4]),
        );

        dispose();
      });
    });

    describe('props.host', () => {
      it('color | backgroundColor | tracelineColor', async () => {
        const { events, context, dispose } = await TestSample.context();
        const ctx = context.ctx;

        const getHost = async () => (await events.info.get()).render?.props?.host!;

        ctx.host.color(-1);
        ctx.host.backgroundColor(-0.123);
        ctx.host.tracelineColor(-0.456);
        expect(context.pending).to.eql(true);
        await context.flush();
        expect(context.pending).to.eql(false);

        const info1 = await getHost();
        expect(info1.color).to.eql(-1);
        expect(info1.backgroundColor).to.eql(-0.123);
        expect(info1.tracelineColor).to.eql(-0.456);

        ctx.host.color(null);
        ctx.host.backgroundColor(null);
        ctx.host.tracelineColor(null);
        await context.flush();

        const info2 = await getHost();
        expect(info2.backgroundColor).to.eql(HOST.backgroundColor);
        expect(info2.color).to.eql(HOST.color);
        expect(info2.tracelineColor).to.eql(HOST.tracelineColor);

        dispose();
      });

      it('backgroundImage', async () => {
        const { events, context, dispose } = await TestSample.context();
        const ctx = context.ctx;
        const getHost = async () => (await events.info.get()).render?.props?.host!;

        const info0 = await getHost();
        expect(info0).to.eql(undefined);

        ctx.host.backgroundImage({ url: 'https://image.com/1.png' });
        await context.flush();

        const info1 = await getHost();
        expect(info1.backgroundImage?.url).to.eql('https://image.com/1.png');

        expect(info1.backgroundImage?.size).to.eql('cover');
        expect(info1.backgroundImage?.margin).to.eql([0, 0, 0, 0]);

        ctx.host.backgroundImage('https://image.com/2.png');
        await context.flush();
        const info2 = await getHost();
        expect(info2.backgroundImage?.url).to.eql('https://image.com/2.png');
        expect(info2.backgroundImage?.size).to.eql('cover');
        expect(info2.backgroundImage?.margin).to.eql([0, 0, 0, 0]);

        ctx.host.backgroundImage({ url: 'https://image.com/3.png', size: 'fill' });
        await context.flush();
        const info3 = await getHost();
        expect(info3.backgroundImage?.url).to.eql('https://image.com/3.png');
        expect(info3.backgroundImage?.size).to.eql('fill');
        expect(info3.backgroundImage?.margin).to.eql([0, 0, 0, 0]);

        ctx.host.backgroundImage({ url: 'https://image.com/4.png', margin: [30] });
        await context.flush();
        const info4 = await getHost();
        expect(info2.backgroundImage?.url).to.eql('https://image.com/4.png');
        expect(info4.backgroundImage?.size).to.eql('cover');
        expect(info4.backgroundImage?.margin).to.eql([30, 30, 30, 30]);

        ctx.host.backgroundImage({
          url: 'https://image.com/5.png',
          size: 'fill',
          margin: [1, 2, 3, 4],
          opacity: 0.3,
        });
        await context.flush();
        const info5 = await getHost();
        expect(info5.backgroundImage?.url).to.eql('https://image.com/5.png');
        expect(info5.backgroundImage?.size).to.eql('fill');
        expect(info5.backgroundImage?.margin).to.eql([1, 2, 3, 4]);
        expect(info5.backgroundImage?.opacity).to.eql(0.3);

        ctx.host.backgroundImage(null);
        await context.flush();
        const info6 = await getHost();
        expect(info6.backgroundImage).to.eql(undefined);

        dispose();
      });

      it('layers', async () => {
        const { events, context, dispose } = await TestSample.context();
        const ctx = context.ctx;

        const getHost = async () => (await events.info.get()).render?.props?.host!;

        const info0 = await getHost();
        expect(info0).to.eql(undefined);

        ctx.host.backgroundColor(1);
        await context.flush();

        const info1 = await getHost();
        expect(info1.layers).to.eql({}); // Empty layers.

        expect(() => ctx.host.layer(0)).to.throw(
          /The index-0 layer is reserved for the main subject/,
        );

        const layer = ctx.host.layer(1);
        expect(layer.index).to.eql(1);
        expect(ctx.host.layer(1)).to.not.equal(layer); // NB: New instance each time (common state stored on render props).

        const renderer1 = () => <div>foo-1</div>;
        const renderer2 = () => <div>foo-2</div>;

        layer.render(renderer1);
        const info2 = await getHost();
        expect(info2.layers['1'].renderer?.fn).to.eql(renderer1);
        expect(info2.layers['1'].index).to.eql(1);

        // Replace renderer.
        ctx.host.layer(1).render(renderer2);
        const info3 = await getHost();
        expect(info3.layers['1'].renderer?.fn).to.eql(renderer2);

        // Item behind main subject (-1).
        ctx.host.layer(-1).render(renderer1);
        const info4 = await getHost();
        expect(info4.layers['-1'].renderer?.fn).to.eql(renderer1);
        expect(info4.layers['1'].renderer?.fn).to.eql(renderer2);
        expect(info4.layers['-1'].index).to.eql(-1);

        dispose();
      });
    });

    describe('props.debug', () => {
      it('row: renderer (fn)', async () => {
        const { events, context, dispose } = await TestSample.context();
        const ctx = context.ctx;

        const fn = () => undefined;
        const res = ctx.debug.row(fn);
        expectRendererId(res.id);

        expect(context.pending).to.eql(true);
        await context.flush();
        expect(context.pending).to.eql(false);

        const info = await events.info.get();
        const debug = info.render.props?.debug!;

        expect(debug.body.renderers.length).to.eql(1);
        expect(debug.body.renderers[0].id).to.eql(res.id);
        expect(debug.body.renderers[0].fn).to.eql(fn);
        dispose();
      });

      it('row: <Element> wrapped into renderer function', async () => {
        const { events, context, dispose } = await TestSample.context();
        const ctx = context.ctx;

        const el = <div>Foo</div>;
        const res = ctx.debug.row(el);
        expectRendererId(res.id);

        await context.flush();

        const info = await events.info.get();
        const debug = info.render.props?.debug!;
        const fn = debug.body.renderers[0].fn;

        expect(debug.body.renderers.length).to.eql(1);
        expect(debug.body.renderers[0].id).to.eql(res.id);
        expect(fn).to.be.a('function');
        expect(fn({} as any)).to.equal(el);
        dispose();
      });

      it('scroll', async () => {
        const { events, context, dispose } = await TestSample.context();
        const ctx = context.ctx;

        const expectValue = async (expected: boolean | undefined) => {
          await context.flush();
          const info = await events.info.get();
          expect(info.render.props?.debug.body.scroll).to.eql(expected);
        };

        await expectValue(undefined);

        ctx.debug.scroll(true);
        await expectValue(true);

        ctx.debug.scroll(false);
        await expectValue(false);

        dispose();
      });

      it('padding', async () => {
        const { events, context, dispose } = await TestSample.context();
        const ctx = context.ctx;

        type T = t.CssMarginInput | undefined | null;
        const expectValue = async (value: T, expected: t.CssEdgesArray) => {
          ctx.debug.padding(value);
          await context.flush();
          const info = await events.info.get();
          expect(info.render.props?.debug.body.padding).to.eql(expected);
        };

        const DEBUG = DEFAULTS.props.debug.body;

        await expectValue(undefined, DEBUG.padding);
        await expectValue(null, DEBUG.padding);

        await expectValue(10, [10, 10, 10, 10]);
        await expectValue([10], [10, 10, 10, 10]);
        await expectValue([10, 99], [10, 99, 10, 99]);
        await expectValue([10, 20, 30, 40], [10, 20, 30, 40]);

        dispose();
      });

      it('width', async () => {
        const { events, context, dispose } = await TestSample.context();
        const ctx = context.ctx;

        const expectValue = async (value: any, expected?: number | null) => {
          ctx.debug.width(value);
          await context.flush();
          const info = await events.info.get();
          expect(info.render.props?.debug.width).to.eql(expected);
        };

        await expectValue(undefined, DEFAULTS.props.debug.width);
        await expectValue(null, null); // NB: means don't render.

        await expectValue(0, 0); // NB: means do render (invisibly). Useful when the contents of the panel are required but hidden, like unmuted media elements
        await expectValue(-1, 0);
        await expectValue(200, 200);

        dispose();
      });

      describe('header', () => {
        const HEADER = DEFAULTS.props.debug.header;

        it('header (props}', async () => {
          const { events, context, dispose } = await TestSample.context();
          const ctx = context.ctx;
          const el = <div>Hello</div>;
          const fn = () => el;
          const getHeader = async () => (await events.info.get()).render.props?.debug.header;

          const info1 = await getHeader();
          expect(info1?.renderer).to.eql(undefined);
          expect(info1?.border.color).to.eql(HEADER.border.color);

          ctx.debug.header.render(fn).border(1);
          await context.flush();

          const info2 = await getHeader();
          expectRendererId(info2?.renderer?.id);
          expect(info2?.renderer?.fn).to.equal(fn);
          expect(info2?.border.color).to.equal(1);

          ctx.debug.header.render(el).border(null);
          await context.flush();

          const info3 = await getHeader();
          expectRendererId(info3?.renderer?.id);
          expect(info3?.renderer?.fn({} as any)).to.equal(el);
          expect(info3?.border.color).to.eql(HEADER.border.color);

          dispose();
        });

        it('padding', async () => {
          const { events, context, dispose } = await TestSample.context();
          const ctx = context.ctx;

          type T = t.CssMarginInput | undefined | null;
          const expectValue = async (value: T, expected: t.CssMarginArray) => {
            ctx.debug.header.padding(value);
            await context.flush();
            const info = await events.info.get();
            expect(info.render.props?.debug.header.padding).to.eql(expected);
          };

          const DEBUG = DEFAULTS.props.debug.header;

          await expectValue(undefined, DEBUG.padding);
          await expectValue(null, DEBUG.padding);

          await expectValue(10, [10, 10, 10, 10]);
          await expectValue([10], [10, 10, 10, 10]);
          await expectValue([10, 99], [10, 99, 10, 99]);
          await expectValue([10, 20, 30, 40], [10, 20, 30, 40]);

          dispose();
        });
      });

      describe('footer', () => {
        const FOOTER = DEFAULTS.props.debug.footer;

        it('footer (props)', async () => {
          const { events, context, dispose } = await TestSample.context();
          const ctx = context.ctx;
          const el = <div>Hello</div>;
          const fn = () => el;
          const getFooter = async () => (await events.info.get()).render.props?.debug.footer;

          const info1 = await getFooter();
          expect(info1?.renderer).to.eql(undefined);
          expect(info1?.border.color).to.eql(FOOTER.border.color);

          ctx.debug.footer.render(fn).border(1);
          await context.flush();

          const info2 = await getFooter();
          expectRendererId(info2?.renderer?.id);
          expect(info2?.renderer?.fn).to.equal(fn);
          expect(info2?.border.color).to.equal(1);

          ctx.debug.footer.render(el).border(null);
          await context.flush();

          const info3 = await getFooter();
          expectRendererId(info3?.renderer?.id);
          expect(info3?.renderer?.fn({} as any)).to.equal(el);
          expect(info3?.border.color).to.eql(FOOTER.border.color);

          dispose();
        });

        it('padding', async () => {
          const { events, context, dispose } = await TestSample.context();
          const ctx = context.ctx;

          type T = t.CssMarginInput | undefined | null;
          const expectValue = async (value: T, expected: t.CssMarginArray) => {
            ctx.debug.footer.padding(value);
            await context.flush();
            const info = await events.info.get();
            expect(info.render.props?.debug.footer.padding).to.eql(expected);
          };

          const DEBUG = DEFAULTS.props.debug.footer;

          await expectValue(undefined, DEBUG.padding);
          await expectValue(null, DEBUG.padding);

          await expectValue(10, [10, 10, 10, 10]);
          await expectValue([10], [10, 10, 10, 10]);
          await expectValue([10, 99], [10, 99, 10, 99]);
          await expectValue([10, 20, 30, 40], [10, 20, 30, 40]);

          dispose();
        });
      });
    });

    describe('state', () => {
      type T = { count: number; msg?: string };
      const initial: T = { count: 0 };

      it('read state', async () => {
        const { events, context, dispose } = await TestSample.context();
        const ctx = context.ctx;

        const state1 = await ctx.state<T>(initial);
        const state2 = await ctx.state<T>(initial);
        const info = await events.info.get();

        expect(info.render.state).to.eql(initial);
        expect(state1.current).to.eql(initial);
        expect(state1).to.equal(state2); // NB: Same instance (on repeat calls).

        dispose();
      });

      it('write state (via mutator function)', async () => {
        const { context, dispose } = await TestSample.context();
        const ctx = context.ctx;
        const state = await ctx.state<T>(initial);
        expect(state.current).to.eql(initial);

        const res = await state.change((draft) => draft.count++);
        expect(res).to.eql({ count: 1 });
        expect(state.current).to.eql({ count: 1 });

        dispose();
      });

      it('causes [events.state.changed$] to fire', async () => {
        const { events, context, dispose } = await TestSample.context();
        const ctx = context.ctx;
        const state = await ctx.state<T>({ count: 0 });

        const fired: t.DevInfoChanged[] = [];
        events.state.changed$.subscribe((e) => fired.push(e));

        await state.change((draft) => draft.count++);

        expect(fired.length).to.eql(1);
        expect(fired[0].message).to.eql('state:write');
        expect(fired[0].info.render.state).to.eql({ count: 1 });

        dispose();
      });

      it('live updates (via event listeners)', async () => {
        const { context, dispose } = await TestSample.context();
        const ctx = context.ctx;
        const state1 = await ctx.state<T>(initial);
        const state2 = await ctx.state<T>(initial);

        await state1.change((draft) => (draft.msg = 'hello'));
        expect(state2.current).to.eql({ count: 0, msg: 'hello' });

        await state2.change((draft) => (draft.count = 1234));
        expect(state1.current).to.eql({ count: 1234, msg: 'hello' });

        dispose();
      });
    });
  },
);
