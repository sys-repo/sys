import { Icon } from '@sys/ui-react-components';
import { TbNetwork } from 'react-icons/tb';
import { TbNetworkOff } from 'react-icons/tb';
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
  MdSettingsInputAntenna,
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
  Network: {
    On: icon(TbNetwork),
    Off: icon(TbNetworkOff),
    Antenna: icon(MdSettingsInputAntenna),
  },
} as const;
