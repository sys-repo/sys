import { expect } from 'chai';
import { useState } from 'react';

import { Keyboard } from '@sys/ui-dom';

import { DevBus } from '../../u/m.Bus/mod.ts';
import { COLORS, Color, Spec, css, Time } from '../common.ts';
import { DevTools } from '../sample.DevTools/mod.ts';
import { MySample } from './MySample.tsx';

let _renderCount = 0;

type T = { count: number; throwError?: boolean };
const initial = { count: 0 };

export default Spec.describe('MySample', (e) => {
  e.it('init', async (e) => {
    _renderCount++;
    const ctx = Spec.ctx(e);
    const state = await ctx.state<T>({ count: 0 });

    expect(state.current.count).to.eql(0); // NB: assertions will be run within CI.

    Keyboard.on('CMD + KeyK', (e) => {
      // NB: Test helpful to ensure errors don't occur on headless run (aka. server/CI).
      console.log('keyboard', e.pattern);
    });
    ctx.host.header.render<T>(() => {
      return <div>Header</div>;
      // return null;
    });

    ctx.host.footer.render<T>(() => {
      return <div>Footer</div>;
      // return null;
    });

    const styles = {
      above: css({ padding: 20 }),
      below: css({ Absolute: [null, 20, 20, null] }),
    };
    ctx.host.layer(1).render(() => <div style={styles.above}>Layer Above</div>);
    ctx.host.layer(-1).render(() => <div style={styles.below}>Layer Below</div>);

    ctx.subject
      .size([300, 200])
      .display('flex')
      .backgroundColor('rgba(255, 0, 0, 0.1)' /* RED */)
      .render<T>((e) => {
        const text = `MySample-${_renderCount}`;
        return (
          <MySample
            style={{ flex: 1 }}
            text={text}
            data={{
              count: e.state.count,
              'size.host': e.size.host,
            }}
            throwError={e.state.throwError}
            onClick={() => {
              ctx.subject.backgroundColor(1);
              state.change((draft) => draft.count++);
            }}
          />
        );
      });
  });

  e.it('ui:debug', async (e) => {
    const ctx = Spec.ctx(e);
    if (!ctx.is.initial) return;

    const dev = DevTools.init(e);
    const debug = ctx.debug;
    const state = await ctx.state<T>(initial);
    const events = DevBus.events(ctx);

    debug.header.padding(0).render(<ComponentSample title={'header'} />);
    debug.footer.border(-0.15).render(<ComponentSample title={'footer'} />);

    debug.row(<ComponentSample title={'row: simple element'} />);
    debug.row(() => <ComponentSample title={'row: via function'} />);
    debug.row(async () => {
      await Time.wait(1500);
      return <ComponentSample title={'row: after delay'} />;
    });
    dev.hr();

    dev
      .button((btn) => {
        let _count = 0;
        btn.label('rename (self)').onClick((e) => {
          _count++;
          e.label(`renamed-${_count}`);
        });
      })
      .hr();

    dev
      .button((btn) => btn.label('run specs').onClick(() => ctx.run()))
      .button((btn) => btn.label('run specs (reset)').onClick(() => ctx.run({ reset: true })))
      .button((btn) =>
        btn.label('throw error').onClick(() => {
          state.change((d) => (d.throwError = true));
        }),
      )
      .hr();

    debug.row(<div>State</div>);
    dev
      .button((btn) => btn.label('increment (+)').onClick(() => state.change((d) => d.count++)))
      .button((btn) => btn.label('decrement (-)').onClick(() => state.change((d) => d.count--)))
      .button((btn) => btn.label('no change').onClick(() => state.change(() => null)))
      .hr();

    debug.row(<div>Harness</div>);
    dev.button((btn) => {
      let _count = 0;
      btn.label('get info').onClick(async (e) => {
        _count++;
        const info = await events.info.get();
        console.group('🌳 info');
        console.info('info', info);
        console.info('info.render.props:', info.render.props);
        console.info('info.render.props.debug:', info.render.props?.debug);
        e.label(`get info-${_count}`);
        console.groupEnd();
      });
    });

    dev
      .button((btn) => btn.label('ctx.redraw( all ) - default').onClick(() => ctx.redraw()))
      .button((btn) => btn.label('ctx.redraw( subject )').onClick(() => ctx.redraw('subject')))
      .button((btn) => btn.label('ctx.redraw( harness )').onClick(() => ctx.redraw('harness')))
      .button((btn) => btn.label('ctx.redraw( debug )').onClick(() => ctx.redraw('debug')));

    dev
      .hr()
      .button((btn) => btn.label('debug.width: 400').onClick((e) => e.ctx.debug.width(400)))
      .button((btn) => btn.label('debug.width: 250').onClick((e) => e.ctx.debug.width(250)))
      .button((btn) => btn.label('debug.width: 0').onClick((e) => e.ctx.debug.width(-99)))
      .button((btn) =>
        btn.label('debug.width: <null> (no render)').onClick((e) => e.ctx.debug.width(null)),
      )
      .hr()
      .button((btn) => btn.label('size: 300, 200').onClick((e) => e.ctx.subject.size([300, 140])))
      .button((btn) => btn.label('size: fill').onClick((e) => e.ctx.subject.size('fill')))
      .button((btn) => btn.label('size: fill-x').onClick((e) => e.ctx.subject.size('fill-x')))
      .button((btn) => btn.label('size: fill-y').onClick((e) => e.ctx.subject.size('fill-y')))
      .hr();

    debug.row(<div>Host</div>);
    dev
      .button((btn) =>
        btn.label('theme: light').onClick(() => {
          ctx.host.color(null).backgroundColor(null).tracelineColor(null);
          // ctx.subject.color(COLORS.DARK);
        }),
      )

      .button((btn) =>
        btn.label('theme: dark').onClick(() => {
          ctx.host.color(COLORS.WHITE).backgroundColor(COLORS.DARK).tracelineColor(0.1);
          // ctx.subject.color(COLORS.WHITE);
        }),
      )
      .button((btn) =>
        btn.label('background image: "url"').onClick(() => {
          const url =
            'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1287&q=80';
          ctx.host.backgroundImage({ url, margin: 60, opacity: 0.3 });
        }),
      )
      .button((btn) =>
        btn.label('background image: null').onClick(() => ctx.host.backgroundImage(null)),
      )
      .hr();

    debug.row(<div>Debug Panel</div>);
    dev
      .button((btn) => btn.label('scroll: true').onClick(() => ctx.debug.scroll(true)))
      .button((btn) => btn.label('scroll: false').onClick(() => ctx.debug.scroll(false)))
      .button((btn) => btn.label('padding: 0').onClick(() => ctx.debug.padding(0)))
      .button((btn) => btn.label('padding: [default]').onClick(() => ctx.debug.padding(null)));
  });
});

/**
 * Helpers
 */

type P = { title?: string };
const ComponentSample = (props: P = {}) => {
  /**
   * NOTE: ensuring hooks behave as expected.
   */
  const [isOver, setOver] = useState(false);
  const over = (isOver: boolean) => () => setOver(isOver);

  const { title = 'Plain Component' } = props;
  const styles = {
    base: css({
      backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
      padding: 7,
      cursor: 'default',
    }),
    inner: css({
      Padding: [5, 10],
      border: `dashed 1px ${Color.format(-0.25)}`,
      borderRadius: 5,
    }),
  };
  return (
    <div style={styles.base}>
      <div style={styles.inner} onMouseEnter={over(true)} onMouseLeave={over(false)}>
        {title}
        {isOver ? ' - over' : ''}
      </div>
    </div>
  );
};
