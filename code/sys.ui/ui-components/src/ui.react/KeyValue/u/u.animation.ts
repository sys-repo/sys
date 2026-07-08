import { type t, D, Is } from '../common.ts';

/** Resolved Motion transition for direct-child projection animation. */
export type ProjectionAnimationTransition = {
  readonly duration: number;
  readonly ease: t.KeyValue.Animation.Ease;
};

/** Resolved direct-child projection animation model. */
export type ProjectionAnimationModel = {
  readonly transition: ProjectionAnimationTransition;
};

/**
 * Resolve public KeyValue animation props into the internal direct-child
 * projection model. The absence of a resolved model means projection animation
 * is disabled.
 */
export function toProjectionAnimation(
  input: t.KeyValue.Animation | undefined,
  items: readonly t.KeyValue.Item[],
): ProjectionAnimationModel | undefined {
  const model = toProjectionAnimationModel(input);
  if (!model) return undefined;
  if (!hasStableProjectionIdentity(items)) return undefined;
  return model;
}

/**
 * Projection animation relies on stable root direct-child identity. Index-keyed
 * projection can animate the wrong conceptual item after insert/remove/order
 * changes, so unstable direct-child identity disables projection animation.
 */
export function hasStableProjectionIdentity(items: readonly t.KeyValue.Item[]) {
  const ids = items.map((item) => item.id);
  if (!ids.every(isId)) return false;
  return new Set(ids).size === ids.length;
}

function toProjectionAnimationModel(
  input?: t.KeyValue.Animation,
): ProjectionAnimationModel | undefined {
  if (input === true) return toModel();
  if (!input) return undefined;
  if (input.enabled === false) return undefined;

  const projection = input.projection ?? true;
  if (projection === true) return toModel();
  if (!projection) return undefined;
  if (projection.enabled === false) return undefined;

  return toModel(projection);
}

function toModel(
  projection?: t.KeyValue.Animation.Projection,
): ProjectionAnimationModel {
  return {
    transition: {
      duration: toSeconds(projection?.duration),
      ease: projection?.ease ?? D.animation.projection.ease,
    },
  };
}

function toSeconds(duration?: t.Msecs) {
  const ms = Is.number(duration) ? Math.max(0, duration) : D.animation.projection.duration;
  return ms / 1000;
}

function isId(id: string | undefined): id is string {
  return Is.string(id) && !Is.blank(id);
}
