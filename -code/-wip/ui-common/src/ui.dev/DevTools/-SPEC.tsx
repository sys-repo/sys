import { DevTools } from '.';
import { Dev, Immutable, Pkg, Time, type t } from '../../test.ui';
import { Sample } from './-SPEC.-sample';

export type T = { count: number; on: boolean; theme?: t.CommonTheme };
const initial: T = { count: 0, on: true };

export default Dev.describe('DevTools', (e) => {
  e.it('init', async (e) => {
    const ctx = Dev.ctx(e);
    await ctx.state<T>(initial);

    ctx.subject
      .display('grid')
      .size([400, null])
      .render<T>((e) => {
        Dev.Theme.background(ctx, e.state.theme);
        return <Sample state={e.state} renderPosition={[-20, 5]} />;
      });
  });

  e.it('ui:debug', async (e) => {
    const dev = DevTools.init<T>(e, initial);
    const debug = dev.ctx.debug;

    /**
     * Header/Footer bars.
     */
    debug.footer.border(-0.15).render((e) => <Dev.Object data={e.state} style={{ margin: 8 }} />);

    dev.title('DevTools', { margin: 0 }).hr(5);

    /**
     * Buttons
     */
    dev.button((btn) =>
      btn.label('state: increment (+)').onClick(async (e) => {
        await e.state.change((draft) => draft.count++);
        e.label(`state: increment (+): count-${e.state.current.count}`);
      }),
    );

    dev.hr(-1, 8);

    dev.textbox((txt) => txt.label('My Textbox TODO'));

    dev.hr(5, 20);

    dev.row((e) => <Dev.RowSpinner margin={[null, null, 10, null]} />);

    dev.TODO();

    dev.section('Boolean', (dev) => {
      /**
       * Booleaan
       */
      dev
        .boolean(async (btn) => {
          btn
            .label('toggle (within closure)')
            .value(true)
            .onClick((e) => {
              console.log('e', e);
              e.value(!e.current);
            });
        })

        .boolean(async (btn) => {
          btn
            .label((e) => `state: ${e.state.on ? 'on' : 'off'}`)
            .value((e) => e.state.on)
            .onClick((e) => {
              e.change((d) => (d.on = !e.current));
            });
        });

      dev.hr(5, 20);

      Dev.Theme.switch(dev, ['theme'], (v) => console.info('callback:', v)); // NB: same as above, but with path

      const propState = Immutable.clonerRef<{ theme?: t.CommonTheme }>({});
      Dev.Theme.immutable(dev, propState);

      dev.hr(5, 20);

      dev.section('Section (Pending)');
    });

    dev.row((e) => <Sample state={e.state} theme={'Light'} />);
    dev.row(async (e) => {
      await Time.wait(1500); // NB: spinner while delayed.
      return <Sample state={e.state} theme={'Light'} />;
    });
    dev.hr(-1, 5);

    const target = 'Module.Loader.Stateful';
    Dev.Link.button(Pkg, dev, `namespace: ƒ("Module.Loader")`, target);

    const link = Dev.Link.pkg(Pkg, dev);
    link
      .button(`pkg.dev (1): "Foo"`, target)
      .button(`pkg.dev (2): "Foo.Bar"`, target)
      .hr()
      .button(`external site: wikipedia`, 'https://www.wikipedia.org/');
  });
});
