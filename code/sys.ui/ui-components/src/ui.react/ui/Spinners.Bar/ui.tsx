import { Color, css, D, type t } from './common.ts';
import { useSweep } from './use.Sweep.ts';

type P = t.BarSpinnerProps;

export const BarSpinner: React.FC<P> = (props) => {
  const { width = D.width, height = D.height, transparentTrack } = props;
  const theme = Color.theme(props.theme);

  const base = css({
    position: 'relative',
    contain: 'layout', // Keep the marks local even if the caller changes `position`.
    overflow: 'hidden',
    borderRadius: 10,
    opacity: 0.5,
    width,
    height,
    color: theme.fg,
    backgroundColor: transparentTrack ? undefined : Color.alpha(theme.fg, 0.2),
  });

  const { lead, trail } = useSweep();

  return (
    <div aria-hidden={true} className={css(base, props.style).class}>
      <span className={lead} />
      <span className={trail} />
    </div>
  );
};
