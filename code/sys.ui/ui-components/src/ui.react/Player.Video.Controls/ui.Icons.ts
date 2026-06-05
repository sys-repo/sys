import { FaPause, FaPlay, FaVolumeMute, FaVolumeOff } from 'react-icons/fa';
import { Icon } from '../Icon/mod.ts';

const icon = Icon.renderer;

/**
 * Icon collection:
 */
export const Icons = {
  Play: icon(FaPlay),
  Pause: icon(FaPause),
  Mute: { On: icon(FaVolumeMute), Off: icon(FaVolumeOff) },
} as const;
