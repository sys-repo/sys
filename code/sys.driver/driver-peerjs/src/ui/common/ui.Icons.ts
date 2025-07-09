import { Icon } from '@sys/ui-react-components';
import { BiCube, BiSolidCube } from 'react-icons/bi';
import { FiExternalLink, FiLink } from 'react-icons/fi';
import { HiMiniCommandLine } from 'react-icons/hi2';
import {
  MdArrowBack,
  MdArrowDownward,
  MdArrowForward,
  MdArrowUpward,
  MdChevronLeft,
  MdChevronRight,
  MdClose,
  MdErrorOutline,
  MdFace,
} from 'react-icons/md';

const icon = Icon.renderer;
export { icon };

/**
 * Icon collection:
 */
export const Icons = {
  Face: icon(MdFace),
  Error: icon(MdErrorOutline),
  Close: icon(MdClose),
  CmdLine: icon(HiMiniCommandLine),
  Cube: { Default: icon(BiCube), Solid: icon(BiSolidCube) },
  Chevron: { Left: icon(MdChevronLeft), Right: icon(MdChevronRight) },
  Link: { External: icon(FiExternalLink), Chain: icon(FiLink) },
  Arrow: {
    Left: icon(MdArrowBack),
    Right: icon(MdArrowForward),
    Up: icon(MdArrowUpward),
    Down: icon(MdArrowDownward),
  },
} as const;
