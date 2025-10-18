/**
 * Flags for evaluating media/video related values.
 */
export type MediaIsLib = {
  /**
   * True if input is a MediaStream.
   */
  mediaStream(input?: unknown): input is MediaStream;

  /**
   * True if input is MediaStreamConstraints ({audio|video} in object)
   * and is not itself a MediaStream.
   */
  constraints(input?: unknown): input is MediaStreamConstraints;

  /**
   * True if input looks like a MediaDeviceInfo.
   * Duck-typed guard (cross-realm safe): requires deviceId + kind.
   */
  deviceInfo(input?: unknown): input is MediaDeviceInfo;

  /**
   * True if input looks like a MediaStreamTrack.
   * Duck-typed guard (cross-realm safe): requires id + kind + getSettings().
   */
  track(input?: unknown): input is MediaStreamTrack;
};
