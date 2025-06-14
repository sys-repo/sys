import { Icon } from '@sys/ui-react-components';
import { MdErrorOutline } from 'react-icons/md';
import { TbDatabase } from 'react-icons/tb';

const icon = Icon.renderer;

/**
 * Icon collection:
 */
export const Icons = {
  Error: icon(MdErrorOutline),
  Database: icon(TbDatabase),
} as const;
