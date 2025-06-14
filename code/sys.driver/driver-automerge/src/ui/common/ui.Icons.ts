import { Icon } from '@sys/ui-react-components';
import { MdErrorOutline, MdOutlineContentCopy } from 'react-icons/md';
import { TbDatabase } from 'react-icons/tb';

const icon = Icon.renderer;

/**
 * Icon collection:
 */
export const Icons = {
  Database: icon(TbDatabase),
  Copy: icon(MdOutlineContentCopy),
  Error: icon(MdErrorOutline),
} as const;
