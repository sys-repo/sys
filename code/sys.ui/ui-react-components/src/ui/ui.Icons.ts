import {
  MdArrowBack,
  MdArrowDownward,
  MdClose,
  MdErrorOutline,
  MdFace,
  MdMic,
  MdMicOff,
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
  Arrow: { Down: icon(MdArrowDownward), Back: icon(MdArrowBack) },
  Mic: { On: icon(MdMic), Off: icon(MdMicOff) },
} as const;
