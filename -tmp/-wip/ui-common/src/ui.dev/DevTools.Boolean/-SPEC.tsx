import { Boolean } from '.';
import { Dev } from '../../test.ui';

import type { BooleanProps } from './ui.Boolean';

type T = {
  count: number;
  props: BooleanProps;
  debug: { enabled: boolean };
};
const initial: T = {
  count: 0,
  props: { value: true },
  debug: { enabled: true },
};

export default Dev.describe('Boolean', (e) => {
  e.it('init', async (e) => {
    const ctx = Dev.ctx(e);
    const state = await ctx.state<T>(initial);

    const onClick = () => {
      state.change(({ props }) => {
        props.value = !props.value;
        props.label = props.value ? 'On' : 'Off';
      });
    };

    ctx.subject
      .display('grid')
      .size([250, null])
      .render<T>((e) => <Boolean {...e.state.props} onClick={onClick} />);
  });

  e.it('ui:debug', async (e) => {
    const dev = Dev.tools<T>(e, initial);
    dev.footer
      .border(-0.1)
      .render<T>((e) => <Dev.Object name={'Dev.Boolean'} data={e.state} expand={1} />);

    dev.section((dev) => {
      dev
        .button('state: increment count', (e) => e.change((d) => d.count++))
        .button('toggle value', (e) => e.change(({ props }) => (props.value = !props.value)))
        .button('toggle value (via helper)', (e) => e.change((e) => Dev.toggle(e.props, 'value')))
        .hr()
        .boolean((btn) => btn.label('no `onClick` - disabled').value(true))
        .boolean((btn) =>
          btn
            .label('value: `undefined`')
            .value(() => undefined)
            .onClick((e) => e.change((d) => d.count++)),
        )
        .boolean((btn) =>
          btn
            .label((e) => `dynamic label and value (count: ${e.state.count})`)
            .value((e) => e.state.count % 2 === 0)
            .onClick((e) => e.change((d) => d.count++)),
        );
    });

    dev.hr();

    dev.section((dev) => {
      dev.boolean((btn) =>
        btn
          .label('debug.enabled')
          .value((e) => e.state.debug.enabled)
          .onClick((e) => e.change((d) => Dev.toggle(d.debug, 'enabled'))),
      );

      dev.boolean((btn) =>
        btn
          .label((e) => `my switch (${e.state.debug.enabled ? 'enabled' : 'disabled'})`)
          .enabled((e) => e.state.debug.enabled)
          .onClick((e) => {
            console.log('onClick');
          }),
      );
    });

    dev.hr();
  });
});
