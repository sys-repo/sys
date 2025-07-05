import { Icon } from '@sys/ui-react-components';
import { BiCube, BiSolidCube } from 'react-icons/bi';
import { HiMiniCommandLine } from 'react-icons/hi2';
import {
  MdChevronLeft,
  MdChevronRight,
  MdClose,
  MdErrorOutline,
  MdMic,
  MdMicOff,
} from 'react-icons/md';

const icon = Icon.renderer;
export { icon };

/**
 * Icon collection:
 */
export const Icons = {
  Error: icon(MdErrorOutline),
  Close: icon(MdClose),
  CmdLine: icon(HiMiniCommandLine),
  Cube: { Default: icon(BiCube), Solid: icon(BiSolidCube) },
  Chevron: { Left: icon(MdChevronLeft), Right: icon(MdChevronRight) },
} as const;
