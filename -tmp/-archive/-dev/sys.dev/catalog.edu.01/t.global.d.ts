export {};

/**
 * Optional global shim for missing DOM types.
 */
declare global {
  namespace MediaTrackShim {
    export type ResizeMode = 'none' | 'crop-and-scale';
    export type LatencyConstraint = number | ConstrainDoubleRange;
    export type LatencySetting = number;
    export type LatencySupported = boolean;
  }

  interface MediaTrackConstraints {
    latency?: MediaTrackShim.LatencyConstraint;
    /** Hint to avoid UA downscaling; supported in Chromium/WebKit. */
    resizeMode?: MediaTrackShim.ResizeMode;
  }

  interface MediaTrackSettings {
    latency?: MediaTrackShim.LatencySetting;
    /** Actual applied resize behavior (if UA reports it). */
    resizeMode?: MediaTrackShim.ResizeMode;
  }

  interface MediaTrackSupportedConstraints {
    latency?: MediaTrackShim.LatencySupported;
    resizeMode?: boolean;
  }
}
