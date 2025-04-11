import { MdFace } from 'react-icons/md';
import { VscSymbolClass } from 'react-icons/vsc';
import { Icon } from './mod.ts';

const icon = Icon.renderer;

/**
 * Icon collection:
 */
export const Icons = {
  Face: icon(MdFace),
  Object: icon(VscSymbolClass),
} as const;
