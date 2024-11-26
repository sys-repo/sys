import { Dev } from '../../test.ui';
import { TextSecret, TextSecretProps } from '.';

type T = { props: TextSecretProps };
const initial: T = {
  props: {
    text: 'abcdefg123456',
    hidden: true,
    monospace: false,
  },
};

export default Dev.describe('TextSecret', (e) => {
  e.it('init', async (e) => {
    const ctx = Dev.ctx(e);
    await ctx.state<T>(initial);
    ctx.subject
      .backgroundColor(1)
      .size([250, null])
      .render<T>((e) => <TextSecret {...e.state.props} />);
  });

  e.it('ui:debug', async (e) => {
    const dev = Dev.tools<T>(e, initial);
    dev.footer
      .border(-0.1)
      .render<T>((e) => <Dev.Object name={'TextSecret'} data={e.state} expand={3} />);

    dev
      .title('Properties')
      .boolean((btn) =>
        btn
          .label('hidden')
          .value((e) => e.state.props.hidden)
          .onClick((e) => e.change((d) => Dev.toggle(d.props, 'hidden'))),
      )
      .boolean((btn) =>
        btn
          .label('monospace')
          .value((e) => e.state.props.monospace)
          .onClick((e) => e.change((d) => Dev.toggle(d.props, 'monospace'))),
      );

    dev.hr();
    dev.title('Text');

    const text = (label: string, text?: any) => {
      dev.button(label, (e) => e.change((d) => (d.props.text = text)));
    };

    text('empty (`""`)', '');
    text('`undefined`', undefined);
    text('`null`', null);
    text('password: "abcdefg123456"', 'abcdefg123456');
    text('long: (hash)', 'ca00241ed17dd01c8248432c4816445127c1905cf244fe34abbbb5c8b0e9d04==');
  });
});
