/**
 * @module
 * EffectController — minimal orchestration primitive.
 *
 * Owns a state snapshot and provides a single, explicit update verb (`next`).
 * Consumers attach effects by subscribing via `onChange` (and cleaning up via
 * the lifecycle). The controller itself is framework-agnostic: it is a small,
 * stable coordination surface for UI and other orchestrations.
 *
 * Design intent:
 * - one source of truth (state snapshot)
 * - one mutation entry point (`next`)
 * - one notification channel (`onChange`) + monotonic `rev`
 * - first-class lifecycle (effects must be disposable)
 *
 * Note: "effects" are not embedded magic; they are external subscriptions
 * bound to this controller’s lifecycle.
 */
export { EffectController } from './m.EffectController.ts';
