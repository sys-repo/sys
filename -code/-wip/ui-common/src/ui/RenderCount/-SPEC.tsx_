import { Dev } from '../../test.ui';
import { css, type t } from '../common';
import { RenderCount } from '.';

type T = {
  count: number;
  props: t.RenderCountProps;
};
const initial: T = { count: 0, props: {} };

export default Dev.describe('RenderCount', (e) => {
  e.it('init', async (e) => {
    const ctx = Dev.ctx(e);
    await ctx.state<T>(initial);
    ctx.subject
      .display('grid')
      .size([250, 30])
      .render<T>((e) => (
        <Sample>
          <RenderCount {...e.state.props} />
        </Sample>
      ));
  });

  e.it('ui:debug', async (e) => {
    const dev = Dev.tools<T>(e, initial);
    dev.footer
      .border(-0.1)
      .render<T>((e) => <Dev.Object name={'RenderCount'} data={e.state} expand={1} />);

    dev.section('Actions', (dev) => {
      dev.button('redraw', (e) => e.change((d) => d.count++));
      dev.hr();
    });

    dev.section('Properties', (dev) => {
      const absolute = (value?: t.RenderCountProps['absolute']) => {
        const label = `absolute: \`${value ?? 'undefined'}\``;
        dev.button(label, (e) => e.change((d) => (d.props.absolute = value)));
      };
      absolute(undefined);
      absolute([-20, 5]);
      dev.hr();
    });
  });
});

/**
 * Sample Container
 */
export type SampleProps = {
  children?: JSX.Element;
  style?: t.CssValue;
};

export const Sample: React.FC<SampleProps> = (props) => {
  const styles = {
    base: css({
      paddingLeft: 5,
      position: 'relative',
      backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
      display: 'grid',
      alignContent: 'center',
    }),
  };
  return (
    <div {...css(styles.base, props.style)}>
      <div>{`🐷`}</div>
      {props.children}
    </div>
  );
};
