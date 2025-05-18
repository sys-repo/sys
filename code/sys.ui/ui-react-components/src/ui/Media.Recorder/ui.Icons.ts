import { MdPause, MdRadioButtonChecked, MdStopCircle } from 'react-icons/md';
import { Icon } from '../Icon/mod.ts';
import { Icons as Base } from '../Icons.ts';

const icon = Icon.renderer;

/**
 * Icon collection:
 */
export const Icons = {
  Arrow: Base.Arrow,
  Face: Base.Face,
  Recording: icon(MdRadioButtonChecked),
  Paused: icon(MdPause),
  Stopped: icon(MdStopCircle),
} as const;
