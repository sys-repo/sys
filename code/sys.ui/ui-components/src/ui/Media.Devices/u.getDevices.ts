import { type t } from './common.ts';

type F = t.MediaDevicesLib['getDevices'];

/**
 * Enumerate available media devices for UI selection.
 * - Pure (no permission prompts)
 * - Hides pseudo devices ("default", "communications") for ALL kinds
 */
export const getDevices: F = async (opts = {}) => {
  const { includePseudo = false } = opts;
  const devices = await navigator.mediaDevices.enumerateDevices();
  return includePseudo ? devices : devices.filter(notPseudo);
};

/**
 * Helpers:
 */
const notPseudo = (d: MediaDeviceInfo) =>
  d.deviceId !== 'default' && d.deviceId !== 'communications';
