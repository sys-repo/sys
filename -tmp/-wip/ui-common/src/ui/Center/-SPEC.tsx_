import { Dev, css, Is } from '../../test.ui';
import { Center } from '.';

type T = { content: string };
const initial: T = { content: '' };

export default Dev.describe('Center', (e) => {
  type LocalStore = { content: string };
  const localstore = Dev.LocalStorage<LocalStore>('dev:sys.ui.common.Center');
  const local = localstore.object({ content: '🐷' });

  e.it('init', async (e) => {
    const ctx = Dev.ctx(e);
    const state = await ctx.state<T>(initial);

    await state.change((draft) => {
      draft.content = local.content;
    });

    ctx.subject
      .backgroundColor(1)
      .size('fill')
      .display('flex')
      .render<T>((e) => {
        const content = e.state.content;

        const styles = {
          base: css({ flex: 1, overflow: 'hidden' }),
          text: css({ fontSize: 120 }),
          img: css({ width: 200 }),
        };

        let el = <div {...styles.text}>{content}</div>;
        if (Is.url(content)) {
          el = <img src={content} {...styles.img} />;
        }

        return <Center style={styles.base}>{el}</Center>;
      });
  });

  e.it('ui:debug', async (e) => {
    const dev = Dev.tools<T>(e, initial);
    dev.footer
      .border(-0.1)
      .render<T>((e) => <Dev.Object name={'spec'} data={e.state} expand={0} />);

    dev.title('Center Component').hr(5);

    // Content.
    dev.section((dev) => {
      const content = (label: string, value?: string) => {
        dev.button(`content: ${label}`, (e) => {
          const content = value ?? label;
          e.change((d) => (d.content = content));
          local.content = content;
        });
      };

      content('🐷');
      content(
        '🧠',
        'https://user-images.githubusercontent.com/185555/221498124-0e10f511-9700-4dd6-8857-25d6811e2ab3.png',
      );
    });
  });
});
