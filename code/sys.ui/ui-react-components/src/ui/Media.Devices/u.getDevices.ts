import { type t } from './common.ts';

export const getDevices: t.MediaDevicesLib['getDevices'] = async () => {
  /**
   * Ensure we already have permission so that device labels are populated
   * (labels are empty until the user grants access).
   */
  await navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
    stream.getTracks().forEach((t) => t.stop());
  });

  // Finish up.
  return await navigator.mediaDevices.enumerateDevices();
};
