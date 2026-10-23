import React from 'react';
import { logInfo, Try } from './common.ts';

/**
 * Hook: Bootstrap media permissions when enumerateDevices()
 * returns devices but with empty labels.
 *
 * - Calls getUserMedia({ audio:true, video:true }) once.
 * - Stops tracks immediately.
 * - Invokes `onAfterBootstrap()` so caller can re-enumerate devices.
 *
 * The hook is passive: it only reacts to the device list
 * supplied by the caller.
 */
export function useBootstrapMediaPermissions(args: {
  items: readonly MediaDeviceInfo[];
  onAfterBootstrap: () => void;
  enabled?: boolean;
}) {
  const { items, onAfterBootstrap, enabled = true } = args;
  const bootstrappedRef = React.useRef(false);

  /**
   * Determine if the current items indicate a permission-less state.
   * Typical scenario:
   *   - enumerateDevices() yields devices
   *   - ALL labels empty → user has not yet granted permission
   */
  const shouldBootstrap = React.useMemo(() => {
    if (!enabled) return false;
    if (bootstrappedRef.current) return false;

    if (typeof navigator === 'undefined') return false;
    if (!navigator.mediaDevices?.getUserMedia) return false;
    if (!Array.isArray(items) || items.length === 0) return false;

    const allLabelsEmpty = items.every((d) => !d.label);
    return allLabelsEmpty;
  }, [items, enabled]);

  /**
   * Perform a one-time getUserMedia() to trigger browser permission prompt.
   * Immediately stop tracks.
   * Notify caller so they can re-enumerate devices.
   */
  const bootstrap = React.useCallback(async () => {
    if (!shouldBootstrap) return;
    bootstrappedRef.current = true;

    const { result } = await Try.run(async () =>
      navigator.mediaDevices.getUserMedia({ audio: true, video: true }),
    );

    if (!result.ok) {
      // NOTE: user may block or dismiss. Do NOT retry.
      // Caller may surface UI message if desired.
      logInfo('MediaDevices bootstrap failed:', result.error);
      return;
    }

    const stream = result.data;
    stream.getTracks().forEach((track) => track.stop());

    onAfterBootstrap();
  }, [shouldBootstrap, onAfterBootstrap]);

  /**
   * Effect: whenever devices update, check if we need bootstrap.
   */
  React.useEffect(() => {
    if (shouldBootstrap) void bootstrap();
  }, [shouldBootstrap, bootstrap]);
}
