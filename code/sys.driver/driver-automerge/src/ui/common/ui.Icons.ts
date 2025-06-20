import { Icon } from '@sys/ui-react-components';
import {
  MdArrowBack,
  MdArrowDownward,
  MdArrowForward,
  MdArrowUpward,
  MdCheck,
  MdClose,
  MdEmojiPeople,
  MdErrorOutline,
  MdFace,
  MdOutlineContentCopy,
  MdWarning,
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
  Warning: icon(MdWarning),
  Clear: icon(MdClose),
  Tick: icon(MdCheck),
  Face: icon(MdFace),
  Person: icon(MdEmojiPeople),
} as const;
