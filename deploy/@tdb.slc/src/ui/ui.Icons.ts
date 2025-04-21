import { Icon } from '@sys/ui-react-components';
import {
  MdAdd,
  MdArrowBack,
  MdArrowDownward,
  MdChevronLeft,
  MdChevronRight,
  MdErrorOutline,
  MdOutlineAddBox,
} from 'react-icons/md';
import { PiProjectorScreenLight } from 'react-icons/pi';
import { RiEmotionSadLine } from 'react-icons/ri';

const icon = Icon.renderer;
export { icon };

/**
 * Icon collection:
 */
export const Icons = {
  Error: icon(MdErrorOutline),
  Add: { Plus: icon(MdAdd), Square: icon(MdOutlineAddBox) },
  Arrow: { Down: icon(MdArrowDownward), Back: icon(MdArrowBack) },
  Chevron: { Left: icon(MdChevronLeft), Right: icon(MdChevronRight) },
  ProjectorScreen: icon(PiProjectorScreenLight),
  Sad: icon(RiEmotionSadLine),
} as const;
