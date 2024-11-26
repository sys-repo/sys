import { Dev, type t } from '../../test.ui';
import { Chip } from '.';

type T = { props: t.ChipProps };
const initial: T = { props: { text: 'hello:world' } };

export default Dev.describe('Chip', (e) => {
  e.it('ui:init', async (e) => {
    const ctx = Dev.ctx(e);
    const state = await ctx.state<T>(initial);

    ctx.host.tracelineColor(-0.06);
    ctx.subject.display('grid').render<T>((e) => {
      return <Chip {...e.state.props} />;
    });
  });

  e.it('ui:debug', async (e) => {
    const dev = Dev.tools<T>(e, initial);

    dev.section('Properties', (dev) => {
      dev.textbox((txt) =>
        txt
          .label((e) => 'text')
          .value((e) => e.state.props.text ?? '')
          .onChange((e) => e.change((d) => (d.props.text = e.to.value)))
          .onEnter((e) => {}),
      );
    });
  });

  e.it('ui:footer', async (e) => {
    const dev = Dev.tools<T>(e, initial);
    dev.footer.border(-0.1).render<T>((e) => {
      const data = { props: e.state.props };
      return <Dev.Object name={'Chip'} data={data} expand={1} />;
    });
  });
});
