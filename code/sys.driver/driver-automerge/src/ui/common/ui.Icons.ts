import { Icon } from '@sys/ui-react-components';
import { BsFileBinaryFill } from 'react-icons/bs';
import { FiExternalLink, FiLink } from 'react-icons/fi';
import { HiDownload } from 'react-icons/hi';
import { LuCopy, LuCopyCheck, LuCopyMinus, LuCopyPlus, LuCopySlash } from 'react-icons/lu';
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
  MdOutlineWifi,
  MdOutlineWifiOff,
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
    Plus: icon(LuCopyPlus),
    Minus: icon(LuCopyMinus),
  },
  Database: icon(TbDatabase),
  Error: icon(MdErrorOutline),
  Warning: icon(MdWarning),
  Clear: icon(MdClose),
  Tick: icon(MdCheck),
  Face: icon(MdFace),
  Person: icon(MdEmojiPeople),
  Download: icon(HiDownload),
  Network: {
    On: icon(TbNetwork),
    Off: icon(TbNetworkOff),
    Antenna: icon(MdSettingsInputAntenna),
  },
  Wifi: {
    On: icon(MdOutlineWifi),
    Off: icon(MdOutlineWifiOff),
  },
  File: { Binary: icon(BsFileBinaryFill) },
  Link: { External: icon(FiExternalLink), Chain: icon(FiLink) },
} as const;
