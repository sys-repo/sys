import { MdArrowBack, MdArrowDownward, MdArrowForward, MdArrowUpward } from 'react-icons/md';

import { Icon } from '@sys/ui-react-components';
const icon = Icon.renderer;

/**
 * Icon collection:
 */
export const Icons = {
  Arrow: {
    Left: icon(MdArrowBack),
    Right: icon(MdArrowForward),
    Up: icon(MdArrowUpward),
    Down: icon(MdArrowDownward),
  },
} as const;
