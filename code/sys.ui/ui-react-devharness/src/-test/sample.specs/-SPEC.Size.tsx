import { type t, css, Spec } from '../common.ts';
import { DevTools } from '../sample.DevTools/mod.ts';

type TOutput = t.JSXElement | null | undefined;

export default Spec.describe('Size/Empty', (e) => {
  let el: TOutput = null;

  e.it('init', (e) => {
    const ctx = Spec.ctx(e);

    ctx.host.tracelineColor(-0.1);
    ctx.subject.render(() => {
      console.info('🌼 subject.render:', el);
      return el;
    });
  });

  e.it('ui:debug', (e) => {
    const ctx = Spec.ctx(e);
    const dev = DevTools.init(e);

    dev.button((btn) => btn.label('redraw').onClick(() => ctx.redraw()));
    dev.hr();

    const renderButton = (label: string, output?: TOutput) => {
      dev.button((btn) => {
        btn.label(`subject: ${label}`).onClick((e) => {
          el = output;
          ctx.redraw();
        });
      });
    };

    renderButton('<div/>', <div />);
    renderButton('null', null);
    renderButton('undefined', undefined);
    dev.hr();
    const bgr = { backgroundColor: 'rgba(255, 0, 0, 0.5)' };
    const renderDiv = (style: t.CssValue) => <div style={css(style, bgr)} />;
    renderButton('<div> ← flat (height: 1px)', renderDiv({ width: 300, height: 1 }));
    renderButton('<div> ← narrow (width: 1px)', renderDiv({ width: 1, height: 300 }));
    renderButton('<div> content </div>', <div>{'👋 hello'}</div>);

    dev.hr();
    const size = (label: string, fn: () => void) => {
      dev.button((btn) => btn.label(`size: ${label}`).onClick(fn));
    };
    size('[null, null]', () => ctx.subject.size([null, null]));
    size('"fill"', () => ctx.subject.size('fill'));
    size('"fill-x"', () => ctx.subject.size('fill-x'));
    size('"fill-y"', () => ctx.subject.size('fill-y'));
  });
});
