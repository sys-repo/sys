import { MdArrowBack, MdArrowDownward, MdClose, MdErrorOutline, MdFace } from 'react-icons/md';
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
} as const;
