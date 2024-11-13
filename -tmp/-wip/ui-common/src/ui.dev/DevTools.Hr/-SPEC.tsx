import { Hr, HrProps } from '.';
import { Color, COLORS, Dev } from '../../test.ui';

type T = { props: HrProps };
const initial: T = { props: {} };

export default Dev.describe('Hr', (e) => {
  e.it('init', async (e) => {
    const ctx = Dev.ctx(e);
    await ctx.state<T>(initial);

    ctx.subject.size('fill-x').render<T>((e) => {
      return <Hr {...e.state.props} />;
    });
  });

  e.it('ui:debug', async (e) => {
    const dev = Dev.tools<T>(e, initial);
    dev.footer
      .border(-0.1)
      .render<T>((e) => <Dev.Object name={'Dev.Hr'} data={e.state} expand={0} />);

    dev.title('Horizontal Rule').hr();

    dev.hr((hr) => hr.thickness(5).margin([40, 10]));
    dev.hr((hr) => hr.thickness(2).margin(2));
    dev.hr((hr) => hr.thickness(2).margin(1));
    dev.hr((hr) => hr.thickness(2).margin(0));
    dev.hr((hr) => hr.thickness(1).margin(1).opacity(0.6));

    dev.hr((hr) => hr.thickness(150).margin([20, 0]));
    dev.hr((hr) => hr.thickness(0).margin([0, 35])); // NB: spacer only

    dev.hr((hr) => hr.thickness(-5).opacity(0.6)); // NB: bounds corrected to -1.
    dev.hr((hr) => hr.thickness(-1).color(Color.alpha(COLORS.MAGENTA, 0.2)).opacity(1));
    dev.hr((hr) => hr.thickness(-1).color(COLORS.MAGENTA).opacity(0.5));
    dev.hr((hr) => hr.color(COLORS.CYAN).opacity(0.5));

    dev.hr(0, 50);

    dev.hr();
    dev.hr(3);
    dev.hr([2, 1]);
    dev.hr([-1, 0.3]);
    dev.hr([-1, 0.5], [], COLORS.CYAN);
  });
});
