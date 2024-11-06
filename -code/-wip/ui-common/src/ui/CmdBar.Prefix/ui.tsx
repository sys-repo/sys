import { useState } from 'react';
import { Color, css, Icons, type t } from './common.ts';

export const View: React.FC<t.CmdPrefixProps> = (props) => {
  const [open, setOpen] = useState(false);

  /**
   * Handlers
   */
  const handleClick = () => setOpen((prev) => !prev);

  /**
   * Render
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
      color: theme.fg,
      borderRight: `solid 1px ${theme.alpha(0.1).fg}`,
    }),
    grid: css({ display: 'grid', placeItems: 'center' }),
    size: {
      width: open ? 150 : 42,
      transition: 'width 300ms ease',
    },
  };

  return (
    <div {...css(styles.base, styles.grid, styles.size, props.style)} onMouseDown={handleClick}>
      <Icons.Object size={20} color={theme.fg} />
    </div>
  );
};
