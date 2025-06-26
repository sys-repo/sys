import { Icon } from '@sys/ui-react-components';
import { LuCopy, LuCopyCheck, LuCopySlash } from 'react-icons/lu';
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
  MdSettingsInputAntenna,
  MdWarning,
} from 'react-icons/md';
import { TbDatabase, TbNetwork, TbNetworkOff } from 'react-icons/tb';

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
  Copy: {
    Basic: icon(LuCopy),
    Tick: icon(LuCopyCheck),
    Slash: icon(LuCopySlash),
  },
  Database: icon(TbDatabase),
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
