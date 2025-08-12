import { LuCopy, LuCopyCheck, LuCopyMinus, LuCopyPlus, LuCopySlash } from 'react-icons/lu';
import {
  MdArrowBack,
  MdArrowDownward,
  MdArrowForward,
  MdArrowUpward,
  MdChevronLeft,
  MdChevronRight,
  MdClose,
  MdConstruction,
  MdErrorOutline,
  MdFace,
  MdMic,
  MdMicOff,
  MdSettings,
} from 'react-icons/md';
import { VscSymbolClass } from 'react-icons/vsc';

import { Icon } from './Icon/mod.ts';
const icon = Icon.renderer;

/**
 * Icon collection:
 */
export const Icons = {
  Close: icon(MdClose),
  Face: icon(MdFace),
  Object: icon(VscSymbolClass),
  Error: icon(MdErrorOutline),
  Arrow: {
    Left: icon(MdArrowBack),
    Right: icon(MdArrowForward),
    Up: icon(MdArrowUpward),
    Down: icon(MdArrowDownward),
  },
  Mic: { On: icon(MdMic), Off: icon(MdMicOff) },
  Settings: { Default: icon(MdSettings) },
  Tools: icon(MdConstruction),
  Copy: {
    Basic: icon(LuCopy),
    Tick: icon(LuCopyCheck),
    Slash: icon(LuCopySlash),
    Plus: icon(LuCopyPlus),
    Minus: icon(LuCopyMinus),
  },
  Chevron: { Left: icon(MdChevronLeft), Right: icon(MdChevronRight) },
} as const;
