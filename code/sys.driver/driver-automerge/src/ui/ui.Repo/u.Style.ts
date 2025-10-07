import { css } from './common.ts';

export const LabelStyle = {
  base: css({
    position: 'relative',
    userSelect: 'none',

    display: 'grid',
    gridAutoFlow: 'column',
    gridAutoColumns: 'auto',
    placeItems: 'center',
  }),
  dim: css({ opacity: 0.5 }),
};
