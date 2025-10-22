/**
 * Optional global shim for missing DOM types.
 */
declare global {
  interface MediaTrackConstraints {
    latency?: number | ConstrainDoubleRange;
    /** Hint to avoid UA downscaling; supported in Chromium/WebKit. */
    resizeMode?: 'none' | 'crop-and-scale';
  }

  interface MediaTrackSettings {
    latency?: number;
    /** Actual applied resize behavior (if UA reports it). */
    resizeMode?: 'none' | 'crop-and-scale';
  }

  interface MediaTrackSupportedConstraints {
    latency?: boolean;
    resizeMode?: boolean;
  }
}
export {};
