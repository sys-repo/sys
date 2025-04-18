import { Icon } from '@sys/ui-react-components';
import { MdAdd, MdArrowDownward, MdErrorOutline, MdOutlineAddBox } from 'react-icons/md';
import { PiProjectorScreenLight } from 'react-icons/pi';

const icon = Icon.renderer;
export { icon };

/**
 * Icon collection:
 */
export const Icons = {
  Error: icon(MdErrorOutline),
  Add: { Plus: icon(MdAdd), Square: icon(MdOutlineAddBox) },
  Arrow: { Down: icon(MdArrowDownward) },
  ProjectorScreen: icon(PiProjectorScreenLight),
} as const;
