import { COLORS, Color, t, css, Dev } from '../../test.ui';
import { useFocus } from '.';

type T = { embedChild: boolean };
const initial: T = { embedChild: true };

export default Dev.describe('useFocus', (e) => {
  e.it('init', async (e) => {
    const ctx = Dev.ctx(e);
    await ctx.state<T>(initial);
    ctx.subject
      .display('grid')
      .backgroundColor(1)
      .size([400, null])
      .render<T>((e) => {
        const elChild = e.state.embedChild && <Sample />;
        return <Sample>{elChild}</Sample>;
      });
  });

  e.it('ui:debug', async (e) => {
    const dev = Dev.tools<T>(e, initial);
    dev.footer
      .border(-0.1)
      .render<T>((e) => <Dev.Object name={'useFocus'} data={e.state} expand={1} />);

    dev.row(() => {
      const style: t.CssValue = {
        border: `dashed 1px ${Color.format(-0.2)}`,
        borderRadius: 5,
        marginBottom: 20,
      };
      return <Sample style={style} />;
      // return null;
    });

    dev.hr();

    dev.section('Options', (dev) => {
      dev.boolean((btn) =>
        btn
          .label('embedded child')
          .value((e) => e.state.embedChild)
          .onClick((e) => e.change((d) => Dev.toggle(d, 'embedChild'))),
      );
    });
  });
});

/**
 * Sample
 */
type SampleProps = {
  children?: JSX.Element | boolean;
  style?: t.CssValue;
};

const Sample = (props: SampleProps) => {
  const focus = useFocus<HTMLDivElement>();
  const { containsFocus, withinFocus } = focus;
  const data = { containsFocus, withinFocus };

  const styles = {
    base: css({ padding: 10, boxSizing: 'border-box', userSelect: 'none' }),
    body: css({
      padding: 10,
      borderRadius: 4,
      border: `dashed 1px ${Color.alpha(COLORS.MAGENTA, 0.5)}`,
      backgroundColor: `rgba(255, 0, 0, ${containsFocus ? 0.1 : 0})` /* RED */,
    }),
    obj: css({ marginTop: 10 }),
  };

  return (
    <div {...css(styles.base, props.style)} ref={focus.ref} tabIndex={0}>
      <div {...styles.body}>
        <div>{`🐷 ${focus.directlyFocused ? 'Focused' : ''}`}</div>
        <Dev.Object data={data} style={styles.obj} />
        {props.children}
      </div>
    </div>
  );
};
