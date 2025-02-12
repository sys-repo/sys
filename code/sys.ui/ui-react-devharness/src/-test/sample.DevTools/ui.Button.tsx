import { RenderCount } from '../../ui/RenderCount/mod.ts';
import { COLORS, Color, css, useMouse, type t } from '../common.ts';

export type ButtonSampleClickHandler = (e: ButtonSampleClickHandlerArgs) => void;
export type ButtonSampleClickHandlerArgs = { ctx: t.DevCtx };

export type ButtonProps = {
  ctx: t.DevCtx;
  label?: string;
  style?: t.CssValue;
  onClick?: ButtonSampleClickHandler;
};

export const ButtonSample: React.FC<ButtonProps> = (props) => {
  const { ctx } = props;
  const mouse = useMouse();

  /**
   * [Render]
   */
  const styles = {
    base: css({
      position: 'relative',
      color: COLORS.DARK,
      backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
      userSelect: 'none',
      transform: `translateY(${mouse.is.down ? 1 : 0}px)`,
      cursor: 'pointer',
      marginBottom: 1,

      display: 'inline-grid',
      gridTemplateColumns: 'auto 1fr',
      columnGap: 4,
    }),
    icon: {
      base: css({
        backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
        display: 'grid',
        justifyContent: 'center',
        alignContent: 'start',
      }),
      image: css({
        Size: 18,
        margin: 5,
        backgroundColor: Color.alpha(COLORS.MAGENTA, 0.2),
        border: `dashed 1px ${Color.format(-0.3)}`,
        borderRadius: 3,
      }),
    },
    body: css({
      position: 'relative',
      margin: 1,
      color: mouse.is.over ? COLORS.BLUE : COLORS.DARK,
      display: 'grid',
      alignContent: 'center',
      justifyContent: 'start',
    }),
  };

  return (
    <div
      style={css(styles.base, props.style)}
      {...mouse.handlers}
      onClick={() => props.onClick?.({ ctx })}
    >
      <div style={styles.icon.base}>
        <div style={styles.icon.image} />
      </div>
      <div style={styles.body}>{props.label || 'Unnamed'}</div>
      <RenderCount />
    </div>
  );
};
