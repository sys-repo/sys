import { type t } from './common.ts';

export const getDevices: t.MediaDevicesLib['getDevices'] = async () => {
  /**
   * Ensure we already have permission so that device labels are populated
   * (labels are empty until the user grants access).
   */
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach((t) => t.stop());
  } catch {
    // NB: ignore – enumeration still works, labels may be empty.
  }

  // Finish up.
  return await navigator.mediaDevices.enumerateDevices();
};
