import { Icon } from '@sys/ui-react-components';
import { MdAdd, MdArrowDownward, MdErrorOutline, MdOutlineAddBox } from 'react-icons/md';

const icon = Icon.renderer;

/**
 * Icon collection.
 */
export const Icons = {
  Error: icon(MdErrorOutline),
  Add: { Plus: icon(MdAdd), Square: icon(MdOutlineAddBox) },
  Arrow: { Down: icon(MdArrowDownward) },
} as const;
