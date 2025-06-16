import { Icon } from '@sys/ui-react-components';
import {
  MdCheck,
  MdClose,
  MdErrorOutline,
  MdOutlineContentCopy,
  MdArrowBack,
  MdArrowForward,
  MdArrowDownward,
  MdArrowUpward,
  MdFace,
} from 'react-icons/md';
import { TbDatabase } from 'react-icons/tb';

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
  Database: icon(TbDatabase),
  Copy: icon(MdOutlineContentCopy),
  Error: icon(MdErrorOutline),
  Clear: icon(MdClose),
  Tick: icon(MdCheck),
  Face: icon(MdFace),
} as const;
