/**
 * @module
 * EffectController — minimal orchestration primitive.
 *
 * Provides a generic orchestration kernel that implements
 * the `t.EffectController` contract from `@sys/types`.
 *
 * The controller is domain-agnostic and accepts injected
 * state storage (e.g. ImmutableRef) and externally attached
 * effects.
 */
export { EffectController } from './m.EffectController.ts';
