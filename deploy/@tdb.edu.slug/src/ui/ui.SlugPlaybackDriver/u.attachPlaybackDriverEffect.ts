import type { t } from './common.ts';

/**
 * Attach the playback driver effect.
 *
 * Manages controller-level integration with the TimecodePlaybackDriver:
 * - Driver lifecycle
 * - Video deck ownership
 * - Snapshot forwarding for UI consumption (aux/debug)
 */
export function attachPlaybackDriverEffect(controller: t.SlugPlaybackController): void {
}
