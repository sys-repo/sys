import { Dev } from '..';
import { COLORS } from '../common';
import { Title, TitleProps } from './ui.Title';

type T = { count: number; props: TitleProps };
const initial: T = {
  count: 0,
  props: {
    text: '👋 Hello Friend',
    style: { ...Title.DEFAULTS.style, margin: 0 },
  },
};

export default Dev.describe('Title', (e) => {
  const LOREM =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque nec quam lorem. Praesent fermentum, augue ut porta varius, eros nisl euismod ante, ac suscipit elit libero nec dolor. Morbi magna enim, molestie non arcu id, varius sollicitudin neque. In sed quam mauris. Aenean mi nisl, elementum non arcu quis, ultrices tincidunt augue. Vivamus fermentum iaculis tellus finibus porttitor. Nulla eu purus id dolor auctor suscipit. Integer lacinia sapien at ante tempus volutpat.';

  e.it('init', async (e) => {
    const ctx = Dev.ctx(e);
    await ctx.state<T>(initial);
    ctx.subject
      .display('grid')
      .size([250, undefined])
      .render<T>((e) => <Title {...e.state.props} />);
  });

  e.it('ui:debug', async (e) => {
    const dev = Dev.tools<T>(e);

    dev.section(['Section', '(Right)'], (dev) => {
      dev.button('hello');
    });

    dev.hr(5, 20);

    dev
      .title((title) =>
        title
          .text((e) => `Hello Title ${e.state.count}`)
          .onClick((e) => console.info('⚡️ onClick')),
      )
      .button('increment (+)', (e) => e.change((d) => d.count++));

    dev.hr();

    dev.title((title) => title.style({ margin: [30, 40], color: COLORS.MAGENTA }));

    dev.hr(5, 20);

    dev
      .title('Properties')
      .boolean((btn) =>
        btn
          .label('bold')
          .value((e) => Boolean(e.state.props.style?.bold))
          .onClick((e) => e.change((e) => Dev.toggle(e.props.style!, 'bold'))),
      )
      .boolean((btn) =>
        btn
          .label('ellipsis')
          .value((e) => Boolean(e.state.props.style?.ellipsis))
          .onClick((e) => e.change((e) => Dev.toggle(e.props.style!, 'ellipsis'))),
      )
      .title((title) =>
        title.text(LOREM).style((e) => {
          return { ...e.state.props.style, margin: [15, 8, 0, 18] };
        }),
      )
      .hr()
      .title('Simple Title')
      .title(['Left', 'Right']);

    dev.hr(5, 20);

    dev.title(['Left', 'Right']);
    dev.hr(-1, 10);
    dev.title([Dev.Lorem.words(50), Dev.Lorem.words(50)]);

    dev.hr(5, 20);

    dev.title('italic', { italic: true });
    dev.title('size: 12 (bold)', { size: 12 });
    dev.title('size: 12 (normal)', { size: 12, bold: false });
    dev.title('size: 12 (normal, opacity: 0.4)', { size: 12, bold: false, opacity: 0.4 });
  });

  e.it('ui:footer', (e) => {
    const dev = Dev.tools<T>(e);
    dev.footer
      .border(-0.1)
      .render<T>((e) => <Dev.Object name={'Dev.Title'} data={e.state} expand={2} />);
  });
});
