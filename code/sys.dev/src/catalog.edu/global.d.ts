/**
 * Optional global shim for missing DOM types.
 */
declare global {
  interface MediaTrackConstraints {
    latency?: number | ConstrainDoubleRange;
  }
  interface MediaTrackSettings {
    latency?: number;
  }
  interface MediaTrackSupportedConstraints {
    latency?: boolean;
  }
}
export {};
