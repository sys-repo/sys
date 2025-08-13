import { Icon } from '@sys/ui-react-components';
import {
  MdArrowBack,
  MdArrowDownward,
  MdArrowForward,
  MdArrowUpward,
  MdChevronLeft,
  MdChevronRight,
  MdErrorOutline,
} from 'react-icons/md';

const icon = Icon.renderer;
export { icon };

/**
 * Icon collection:
 */
export const Icons = {
  Error: icon(MdErrorOutline),
  Chevron: { Left: icon(MdChevronLeft), Right: icon(MdChevronRight) },
  Arrow: {
    Left: icon(MdArrowBack),
    Right: icon(MdArrowForward),
    Up: icon(MdArrowUpward),
    Down: icon(MdArrowDownward),
  },
} as const;
