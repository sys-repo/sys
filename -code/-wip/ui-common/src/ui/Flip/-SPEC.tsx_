import { Flip } from '.';
import { COLORS, css, Dev, Keyboard, Pkg, type t } from '../../test.ui';

type T = {
  props: t.FlipProps;
  debug: { content?: boolean };
};
const initial: T = {
  props: { flipped: false },
  debug: { content: true },
};

const name = 'Flip';
export default Dev.describe(name, (e) => {
  type LocalStore = T['debug'];

  const localstore = Dev.LocalStorage<LocalStore>(`dev:${Pkg.name}.${name}`);
  const local = localstore.object({
    content: initial.debug.content,
  });

  e.it('ui:init', async (e) => {
    const ctx = Dev.ctx(e);
    const state = await ctx.state<T>(initial);
    state.change((d) => {
      d.debug.content = local.content;
    });

    ctx.debug.width(300);
    ctx.subject
      .size([250, null])
      .display('grid')
      .render<T>((e) => {
        const debug = e.state.debug;

        const styles = {
          face: css({ padding: 10, backgroundColor: COLORS.WHITE }),
          title: css({ marginBottom: 10 }),
          emoji: css({ fontSize: 38, display: 'grid', placeItems: 'center' }),
        };

        const elFront = (
          <div {...styles.face}>
            <div {...styles.emoji}>🙊</div>
            <div {...styles.title}>Frontside</div>
          </div>
        );
        const elBack = (
          <div {...styles.face}>
            <div {...styles.emoji}>🙈</div>
            <div {...styles.title}>Backside</div>
            <div>{Dev.Lorem.words(20)}</div>
          </div>
        );

        const props = {
          ...e.state.props,
          front: debug.content ? elFront : undefined,
          back: debug.content ? elBack : undefined,
        };

        return <Flip {...props} />;
      });
  });

  e.it('keyboard:init', async (e) => {
    const dev = Dev.tools<T>(e, initial);
    const state = await dev.state();
    Keyboard.on({
      Enter(e) {
        e.handled();
        state.change((d) => Dev.toggle(d.props, 'flipped'));
      },
      Space(e) {
        e.handled();
        state.change((d) => Dev.toggle(d.debug, 'content'));
      },
    });
  });

  e.it('ui:debug', async (e) => {
    const dev = Dev.tools<T>(e, initial);

    dev.section('Properties', (dev) => {
      dev.boolean((btn) =>
        btn
          .label((e) => `flipped (← Enter)`)
          .value((e) => e.state.props.flipped)
          .onClick((e) => e.change((d) => Dev.toggle(d.props, 'flipped'))),
      );
    });

    dev.hr(5, 20);

    dev.section('Debug', (dev) => {
      dev.boolean((btn) =>
        btn
          .label((e) => `content (← Space)`)
          .value((e) => e.state.debug.content)
          .onClick((e) => e.change((d) => (local.content = Dev.toggle(d.debug, 'content')))),
      );
    });
  });

  e.it('ui:footer', async (e) => {
    const dev = Dev.tools<T>(e, initial);
    dev.footer.border(-0.1).render<T>((e) => {
      const data = {
        props: e.state.props,
      };
      return <Dev.Object name={name} data={data} expand={1} />;
    });
  });
});
